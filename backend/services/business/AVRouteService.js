// backend/services/business/AVRouteService.js
const AutoXAVRoute = require('../providers/AutoXAVRoute');
const ConfigService = require('../ConfigService');

let currentProvider = null;
let providerCache = null;
let lastProviderCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

/**
 * 获取当前无人车路径规划服务提供商（异步，从数据库读取配置）
 * @returns {Promise<AVRouteProvider>} 无人车路径规划服务提供商实例
 */
async function getAVRouteService() {
  const now = Date.now();
  
  // 检查缓存是否过期
  if (providerCache && (now - lastProviderCheck) < CACHE_TTL) {
    return providerCache;
  }

  try {
    // 从数据库获取默认提供商
    const defaultProvider = await ConfigService.getDefaultProvider('route');
    
    if (!defaultProvider) {
      // 如果数据库没有配置，使用默认 AutoX
      const apiKey = process.env.AUTOX_AV_ROUTE_API_KEY || 'default_key';
      const baseUrl = process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com';
      providerCache = new AutoXAVRoute({ apiKey, baseUrl });
    } else if (defaultProvider.provider_name === 'AutoXAVRoute') {
      providerCache = new AutoXAVRoute({ 
        apiKey: defaultProvider.api_key || process.env.AUTOX_AV_ROUTE_API_KEY || 'default_key',
        baseUrl: defaultProvider.api_endpoint || process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com'
      });
    } else {
      // 未知提供商，回退到 AutoX
      const apiKey = process.env.AUTOX_AV_ROUTE_API_KEY || 'default_key';
      const baseUrl = process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com';
      providerCache = new AutoXAVRoute({ apiKey, baseUrl });
    }

    currentProvider = providerCache;
    lastProviderCheck = now;
    console.log(`[AVRouteService] 使用路径规划提供商：${defaultProvider ? defaultProvider.provider_name : 'AutoXAVRoute(默认)'}`);
    return currentProvider;
  } catch (error) {
    console.error('[AVRouteService] 获取路径规划服务失败:', error.message);
    // 回退到默认 AutoX
    const apiKey = process.env.AUTOX_AV_ROUTE_API_KEY || 'default_key';
    const baseUrl = process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com';
    currentProvider = new AutoXAVRoute({ apiKey, baseUrl });
    return currentProvider;
  }
}

/**
 * 设置无人车路径规划服务提供商（用于测试）
 * @param {AVRouteProvider} provider 无人车路径规划服务提供商实例
 */
function setAVRouteService(provider) {
  currentProvider = provider;
  providerCache = provider;
  lastProviderCheck = Date.now();
}

/**
 * 清除缓存，强制重新加载配置
 */
function reloadConfig() {
  providerCache = null;
  lastProviderCheck = 0;
  currentProvider = null;
}

module.exports = {
  getAVRouteService,
  setAVRouteService,
  reloadConfig
};
