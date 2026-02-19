// backend/config/av-route.js
module.exports = {
  defaultProvider: process.env.AV_ROUTE_PROVIDER || 'AutoXAVRoute', // 默认路径规划提供商

  providers: {
    AutoXAVRoute: {
      apiKey: process.env.AUTOX_AV_ROUTE_API_KEY,
      baseUrl: process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com',
      enabled: process.env.AUTOX_AV_ROUTE_ENABLED !== 'false'
    },
    NeowayAVRoute: {
      apiKey: process.env.NEOWAY_AV_ROUTE_API_KEY,
      baseUrl: process.env.NEOWAY_AV_ROUTE_BASE_URL || 'https://api.neoway.com',
      enabled: process.env.NEOWAY_AV_ROUTE_ENABLED !== 'false'
    }
  },

  // 路径规划缓存配置
  routeCache: {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 500
  },

  // 路径规划请求频率限制
  rateLimit: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 1分钟
  }
};