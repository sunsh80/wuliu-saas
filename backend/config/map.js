// backend/config/map.js
module.exports = {
  defaultProvider: process.env.MAP_PROVIDER || 'TencentMap', // 默认地图提供商

  providers: {
    TencentMap: {
      apiKey: process.env.TENCENT_MAP_API_KEY,
      enabled: process.env.TENCENT_MAP_ENABLED !== 'false'
    },
    BaiduMap: {
      apiKey: process.env.BAIDU_MAP_API_KEY,
      enabled: process.env.BAIDU_MAP_ENABLED !== 'false'
    }
  },

  // 地理编码缓存配置
  geocodeCache: {
    enabled: true,
    ttl: 86400, // 24小时
    maxSize: 1000
  },

  // 请求频率限制
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1分钟
  }
};