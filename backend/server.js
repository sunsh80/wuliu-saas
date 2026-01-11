// server.js - OpenAPI 驱动 + 自动注册 handlers + 生产级中间件 + 数据库初始化
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ✅ 引入数据库模块（自动加载 ./db/index.js）
const { openDatabaseAndInitialize } = require('./db');

// ✅ 引入 AJV 格式插件（支持 email / date-time）
const addFormats = require('ajv-formats');

// ✅ 兼容 openapi-backend@5.2.1
const { default: OpenApiBackend } = require('openapi-backend');

const app = express();
const port = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每 IP 100 次请求
});
app.use(limiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'wuliu-2026-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 开发环境设为 false；生产 HTTPS 设为 true
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 小时
    },
  })
);

// ===== OpenAPI 自动路由 + 自动注册 handlers =====
const api = new OpenApiBackend({
  definition: path.resolve(__dirname, 'openapi.yaml'),
  strict: true, // 未实现的 operationId 会报错
  validate: true,
  ajvOpts: {
    strict: false,
    plugins: [addFormats],
  },
});

function autoRegisterHandlers() {
  const handlersDir = path.join(__dirname, 'api', 'handlers');
  if (!fs.existsSync(handlersDir)) {
    console.warn('⚠️ handlers 目录不存在:', handlersDir);
    return;
  }

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath); // 递归子目录
      } else if (file.endsWith('.js')) {
        const operationId = path.basename(file, '.js');
        const handler = require(fullPath);
        // 🔒 安全检查：确保 handler 是函数
        if (typeof handler !== 'function') {
          console.error(`❌ 错误: Handler "${operationId}" 必须导出一个函数！`);
          console.error(` 文件路径: ${fullPath}`);
          console.error(` 实际导出类型: ${typeof handler}`);
          console.error(` 导出值预览:`, handler);
          process.exit(1);
        }
        api.register(operationId, handler);
        console.log(`✅ 注册 handler: ${operationId}`);
      }
    }
  }
  walk(handlersDir);
}

// ===== 启动函数 =====
async function startServer() {
  try {
    // ✅ 第一步：初始化数据库
    await openDatabaseAndInitialize();

    // ✅ 第二步：注册所有 handlers
    autoRegisterHandlers();
    await api.init();

    // ✅ 第三步：挂载 OpenAPI 请求处理器（只处理 /api）
    app.use(async (req, res, next) => {
      if (!req.path.startsWith('/api')) {
        return next();
      }
      try {
        const response = await api.handleRequest({
          method: req.method,
          path: req.path,
          query: req.query,
          headers: req.headers,
          body: req.body,
        });
        res.status(response.statusCode);
        if (response.headers) {
          Object.entries(response.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        if (response.body !== undefined && response.body !== null) {
          if (typeof response.body === 'object') {
            res.json(response.body);
          } else {
            res.send(response.body);
          }
        } else {
          res.end();
        }
      } catch (err) {
        console.error('❌ OpenAPI 处理错误:', err.stack);
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
      }
    });

    // ===== 健康检查 =====
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        time: new Date().toISOString(),
        node_env: process.env.NODE_ENV || 'development',
      });
    });

    // ===== 全局错误兜底 =====
    app.use((err, req, res, next) => {
      console.error('❌ 全局错误:', err.stack);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    });

    // ===== 启动 HTTP 服务器 =====
    app.listen(port, () => {
      console.log(`✅ 物流平台 API 启动成功`);
      console.log(`📄 契约文件: ${path.resolve(__dirname, 'openapi.yaml')}`);
      console.log(`🌐 服务地址: http://localhost:${port}`);
      console.log(`🧪 测试: curl http://localhost:${port}/health`);
    });
  } catch (err) {
    console.error('💥 服务启动失败:', err);
    process.exit(1);
  }
}

// ✅ 执行启动
startServer();