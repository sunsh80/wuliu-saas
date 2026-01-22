// backend/config/index.js
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    name: '【沈阳战旗】无人物流SaaS平台 API'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'wuliu-2026-secret-key',
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      signed: true,
      path: '/',
      name: 'connect.sid'
    }
  },
  
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 500  // 提高限制以避免测试中的速率限制错误
    },
    cors: {
      origin: true,
      credentials: true
    }
  },
  
  openapi: {
    definition: './openapi.yaml',
    strict: true,
    validate: true
  }
};