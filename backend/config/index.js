// backend/config/index.js
require('dotenv').config(); // 添加这一行以加载 .env 文件

module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 3000, // 从 .env 读取 PORT
    name: process.env.SERVER_NAME || '【沈阳战旗】无人物流SaaS平台 API', // 可选：从 .env 读取服务器名称
  },
  session: {
    secret: process.env.SESSION_SECRET || 'wuliu-2026-secret-key', // 从 .env 读取 SESSION_SECRET
    cookie: {
      secure: false, // 根据您的部署环境调整 (HTTPS 为 true)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      signed: true,
      path: '/',
      name: 'connect.sid',
    },
  },
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // 提高限制以避免测试中的速率限制错误
    },
    cors: {
      origin: process.env.CORS_ORIGIN || true, // 可选：从 .env 读取 CORS 源
      credentials: true,
    },
  },
  openapi: {
    definition: './openapi.yaml',
    strict: true,
    validate: true,
  },
};