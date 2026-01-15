// backend/server.js
// OpenAPI 驱动 + 自动注册 handlers + 生产级中间件 + 数据库初始化
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ✅ 引入数据库模块（自动加载 ./db/index.js）
// 现在它包含了所有我们需要的数据库方法
const { openDatabaseAndInitialize } = require('./db/index.js');

// ✅ 引入 AJV 格式插件（支持 email / date-time）
const addFormats = require('ajv-formats');

// 创建 Express 应用实例 (关键！)
const app = express();

// 配置中间件 (按顺序应用)
app.use(session({
  secret: process.env.SESSION_SECRET || 'wuliu-2026-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 开发环境设为 false；生产 HTTPS 设为 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 小时
  },
}));

// ✅ 兼容 openapi-backend@5.2.1。引入并初始化 OpenApiBackend
const { default: OpenApiBackend } = require('openapi-backend');
const port = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每 IP 100 次请求
});
app.use(limiter);

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

// 注册安全处理器
api.registerSecurityHandler('TenantSessionAuth', (c, req, res) => {
  console.log("=== TenantSessionAuth Security Handler Called ==="); // 调试日志
  console.log("Session object:", req.session); // 调试日志
  console.log("Session User ID:", req.session.userId); // 调试日志 (或 req.session.user?.id)

  // 检查 req.session 是否存在用户信息
  if (req.session && req.session.userId) { // 或者 req.session.user?.id 或其他你存储的标识
    // 将用户信息附加到 openapi-backend 的上下文中
    c.user = { id: req.session.userId }; // 或者 c.user = req.session.user;
    console.log("Authentication successful, user attached to context:", c.user);
    return true; // 认证成功
  } else {
    console.log("Authentication failed: No userId found in session.");
    return [401, { message: 'Unauthorized: Please log in.' }]; // 认证失败
  }
});

api.register('notFound', (c, __) => {
  console.log(`⚠️ Route not Found: ${c.request.method} ${c.request.path}`);
  return { status: 404, body: { message: 'Not Found' } };
});

api.register('validationFail', (c, __) => {
  console.log(`⚠️ Validation failed for: ${c.request.method} ${c.request.path}`, c.validation.errors);
  return { status: 400, body: { message: 'Bad Request', errors: c.validation.errors } };
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

      // 在调用 openapi-backend 之前检查 req.session
      console.log("--- Before api.handleRequest ---");
      console.log("Path:", req.path);
      console.log("req.session exists?", !!req.session);
      console.log("req.session type?", typeof req.session);
      // console.log("req.session content?", req.session); // 可选

      // 使用一个标志来跟踪是否已发送响应，防止重复发送
      let responseSent = false;

      try {
        const response = await api.handleRequest({
          method: req.method,
          path: req.path,
          query: req.query,
          headers: req.headers,
          body: req.body,
          request: req,
        });

        console.log("--- After api.handleRequest (Success) ---");
        console.log("Path:", req.path);
        console.log("req.session exists after handler?", !!req.session);
        // console.log("req.session content after handler?", req.session); // 可选

        // **关键修改：检查是否是登录请求，并处理 Session**
        if (req.path === '/api/tenant-web/login' && response.body && response.body.success === true) {
            // 确认是成功的登录响应
            const sessionData = response.body.sessionData; // 提取 sessionData
            if (sessionData && req.session) { // 检查 sessionData 是否存在且 req.session 可用
                // 将登录信息写入 session
                req.session.userId = sessionData.userId;
                req.session.tenantId = sessionData.tenantId;
                req.session.email = sessionData.email;
                console.log("✅ Session set in server.js for user:", sessionData.userId, "Tenant:", sessionData.tenantId);
            } else {
                console.warn("⚠️ Login successful but sessionData missing in response or session unavailable.");
                console.log("  - response.body:", response.body);
                console.log("  - req.session available:", !!req.session);
            }
            // 清理响应体中的 sessionData，不要返回给客户端
            delete response.body.sessionData;
        }

        // 检查响应格式并发送
        if (response && typeof response === 'object' && response.hasOwnProperty('statusCode')) {
          // 我们的自定义处理器返回格式 { statusCode: ..., body: ... }
          const { statusCode = 500, body = { error: 'Unknown error' } } = response;
          if (!res.headersSent) { // 在发送前再次检查
              res.status(statusCode).json(body);
              responseSent = true; // 标记已发送
          } else {
              console.warn('Response already sent before sending custom handler response.');
          }
        } else if (response && typeof response === 'object' && response.status && response.headers && response.body) {
          // openapi-backend 内部可能的格式
          if (!res.headersSent) { // 在发送前再次检查
              res.status(response.status).set(response.headers).send(response.body);
              responseSent = true; // 标记已发送
          } else {
              console.warn('Response already sent before sending internal handler response.');
          }
        } else {
          // 其他格式，直接发送 JSON
          if (!res.headersSent) { // 在发送前再次检查
              res.json(response);
              responseSent = true; // 标记已发送
          } else {
              console.warn('Response already sent before sending other format response.');
          }
        }
      } catch (err) { // 这里的 err 是 api.handleRequest 抛出的错误
        console.log("--- After api.handleRequest (Error) ---");
        console.log("Path:", req.path);
        console.log("req.session exists after handler (error)?", !!req.session);

        // 如果在此处尝试发送响应前，上面的 try 块已经发送了响应，则跳过
        if (res.headersSent) {
          console.warn('⚠️  响应已发送，无法再发送错误响应。错误详情:', err.message);
          console.error('Full error stack:', err.stack); // 打印完整堆栈以便调试
          return; // 直接返回，不尝试发送新响应
        }

        // 如果响应尚未发送，则发送错误响应
        console.error('❌ OpenAPI 处理错误:', err.stack);
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
        responseSent = true; // 标记已发送
      }

      // 如果走到这里，说明上面的 try/catch 块都执行完毕
      // 如果 responseSent 仍为 false，说明 api.handleRequest 返回了一个非标准格式且未发送，
      // 或者有其他逻辑遗漏，但我们不强制发送，让 Express 默认处理或结束请求。
      // 最重要的是确保上面的每个发送点都有 !res.headersSent 检查。
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
      // 如果响应头已经发送，就不尝试发送错误了
      if (!res.headersSent) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
      }
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

// --- 以下是一个示例，展示如何在 server.js 中直接使用新的数据库方法 ---
// 这通常应该放在 api/handlers/ 目录下的具体 handler 文件中
/*
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await createUser({ username, email, password, user_type: 'user' });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/