// backend/services/business/AVRouteService.js
const AutoXAVRoute = require('../providers/AutoXAVRoute');
const config = require('../../config/av-route');

let currentProvider = null;

/**
 * 获取当前无人车路径规划服务提供商
 * @returns {AVRouteProvider} 无人车路径规划服务提供商实例
 */
function getAVRouteService() {
  if (!currentProvider) {
    const providerName = config.defaultProvider;
    
    if (providerName === 'AutoXAVRoute' && config.providers.AutoXAVRoute.enabled) {
      currentProvider = new AutoXAVRoute({ 
        apiKey: config.providers.AutoXAVRoute.apiKey,
        baseUrl: config.providers.AutoXAVRoute.baseUrl 
      });
    } else {
      // 默认使用AutoX
      currentProvider = new AutoXAVRoute({ 
        apiKey: process.env.AUTOX_AV_ROUTE_API_KEY || 'default_key',
        baseUrl: process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com'
      });
    }
  }
  
  return currentProvider;
}

/**
 * 设置无人车路径规划服务提供商
 * @param {AVRouteProvider} provider 无人车路径规划服务提供商实例
 */
function setAVRouteService(provider) {
  currentProvider = provider;
}

module.exports = {
  getAVRouteService,
  setAVRouteService
};