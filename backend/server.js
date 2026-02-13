// backend/server.js
console.log('🔍 开始加载配置...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// 配置
const config = require('./config/index.js');
console.log('✅ 配置加载成功，完整内容:', JSON.stringify(config, null, 2));

// 中间件
const sessionMiddleware = require('./middleware/session');
const authMiddleware = require('./middleware/auth');
const OpenApiMiddleware = require('./middleware/openapi');
const errorMiddleware = require('./middleware/error');
const debugMiddleware = require('./middleware/debug'); 
const authRouter = require('./routes/auth');// 认证路由
console.log('✅ 中间件模块加载成功');


// 数据库
const { openDatabaseAndInitialize } = require('./db');
console.log('✅ 数据库模块加载成功');

const app = express();
const port = config.server.port;

// ===== 基础中间件 =====
app.use(cookieParser(config.session.secret));
app.use(authMiddleware.loginSessionReset); // 登录session重置
app.use(helmet());
app.use(cors(config.security.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(rateLimit(config.security.rateLimit));
app.use('/api/auth', authRouter);

// ===== 启动函数 =====
async function startServer() {
  try {
    // 初始化数据库
    await openDatabaseAndInitialize();
    console.log('✅ 数据库初始化完成');

    // 初始化OpenAPI中间件
    const openApiMiddleware = new OpenApiMiddleware();
    const api = await openApiMiddleware.initialize(
      authMiddleware.openApiSecurityHandler(openApiMiddleware.api)
    );

    // ===== 调试端点（仅开发环境）=====
    if (process.env.NODE_ENV === 'development') {
      app.post('/debug/login', debugMiddleware.debugLogin);
      app.get('/debug/session', debugMiddleware.debugSession);
      
      console.log('\n🔧 调试端点:');
      console.log(` POST http://localhost:${port}/debug/login`);
      console.log(` GET http://localhost:${port}/debug/session`);
    }

    // ===== API 路由 =====
    app.use(openApiMiddleware.apiHandler());
    console.log('✅ 配置加载成功:', config.server.name);

    // ===== 额外API路由 =====
    // 车型库API路由
    const vehicleModelsRouter = require('./api/routes/admin/vehicle-models');
    app.use('/api/admin/vehicle-models', vehicleModelsRouter);
    
    // 承运商车辆API路由（与车型库集成）
    const tenantVehiclesRouter = require('./api/routes/tenant-web/vehicles');
    app.use('/api/tenant-web/vehicles', tenantVehiclesRouter);

    // ===== 健康检查 =====
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        service: config.server.name,
        time: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // ===== 错误处理 =====
    app.use(errorMiddleware.apiErrorHandler);
    app.use(errorMiddleware.globalErrorHandler);
    
// ===== 启动开始 =====
    app.listen(port, () => {
      console.log(`\n✅ ${config.server.name} 启动成功`);
      console.log(`🌐 服务地址: http://localhost:${port}`);
      console.log(`📊 健康检查: http://localhost:${port}/health`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (err) {
    console.error('💥 服务启动失败:', err);
    process.exit(1);
  }
}

// 启动服务器
startServer();