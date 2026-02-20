// backend/config/index.js

require('dotenv').config(); // 添加这一行以加载 .env 文件

module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    name: process.env.SERVER_NAME || '【沈阳战旗】数孪智运无人物流SaaS平台 API',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'wuliu-2026-secret-key',
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
      signed: true,
      path: '/',
      name: 'connect.sid',
    },
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 500,
    },
    cors: {
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    },
  },

  openapi: {
    definition: './openapi.yaml',
    strict: false,  // 禁用严格模式，允许未定义的 handler
    validate: true,
  },

  // 👇 新增：debug 标志，用于控制是否输出调试日志
  debug: process.env.DEBUG === 'true' || false, // 默认为 false，可通过环境变量开启
};