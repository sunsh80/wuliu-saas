// backend/config/tracking.js
module.exports = {
  defaultProvider: process.env.TRACKING_PROVIDER || 'VehicleCompanyTracking', // 默认位置回传提供商

  providers: {
    VehicleCompanyTracking: {
      apiEndpoint: process.env.VEHICLE_COMPANY_API_ENDPOINT,
      authToken: process.env.VEHICLE_COMPANY_AUTH_TOKEN,
      enabled: process.env.VEHICLE_COMPANY_TRACKING_ENABLED !== 'false'
    },
    LocationServiceProvider: {
      apiEndpoint: process.env.LOCATION_SERVICE_API_ENDPOINT,
      authToken: process.env.LOCATION_SERVICE_AUTH_TOKEN,
      enabled: process.env.LOCATION_SERVICE_TRACKING_ENABLED !== 'false'
    }
  },

  // 位置数据存储配置
  storage: {
    retentionDays: 30, // 数据保留天数
    batchSize: 100, // 批量处理大小
    enableCompression: true
  },

  // WebSocket连接配置
  websocket: {
    heartbeatInterval: 30000, // 心跳间隔（毫秒）
    reconnectAttempts: 5, // 重连尝试次数
    reconnectDelay: 1000 // 重连延迟（毫秒）
  }
};