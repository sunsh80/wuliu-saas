// backend/services/business/TrackingService.js
const VehicleCompanyTracking = require('../providers/VehicleCompanyTracking');
const ConfigService = require('../ConfigService');

let currentProvider = null;
let providerCache = null;
let lastProviderCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

/**
 * 获取当前车辆跟踪服务提供商（异步，从数据库读取配置）
 * @returns {Promise<VehicleTrackingProvider>} 车辆跟踪服务提供商实例
 */
async function getTrackingService() {
  const now = Date.now();
  
  // 检查缓存是否过期
  if (providerCache && (now - lastProviderCheck) < CACHE_TTL) {
    return providerCache;
  }

  try {
    // 从数据库获取默认提供商
    const defaultProvider = await ConfigService.getDefaultProvider('tracking');
    
    if (!defaultProvider) {
      // 如果数据库没有配置，使用默认 VehicleCompanyTracking
      const apiEndpoint = process.env.VEHICLE_COMPANY_API_ENDPOINT || 'https://api.vehicle-company.com';
      const authToken = process.env.VEHICLE_COMPANY_AUTH_TOKEN || 'default_token';
      providerCache = new VehicleCompanyTracking({ apiEndpoint, authToken });
    } else if (defaultProvider.provider_name === 'VehicleCompanyTracking') {
      providerCache = new VehicleCompanyTracking({ 
        apiEndpoint: defaultProvider.api_endpoint || process.env.VEHICLE_COMPANY_API_ENDPOINT || 'https://api.vehicle-company.com',
        authToken: defaultProvider.auth_token || process.env.VEHICLE_COMPANY_AUTH_TOKEN || 'default_token'
      });
    } else {
      // 未知提供商，回退到 VehicleCompanyTracking
      const apiEndpoint = process.env.VEHICLE_COMPANY_API_ENDPOINT || 'https://api.vehicle-company.com';
      const authToken = process.env.VEHICLE_COMPANY_AUTH_TOKEN || 'default_token';
      providerCache = new VehicleCompanyTracking({ apiEndpoint, authToken });
    }

    currentProvider = providerCache;
    lastProviderCheck = now;
    console.log(`[TrackingService] 使用车辆跟踪提供商：${defaultProvider ? defaultProvider.provider_name : 'VehicleCompanyTracking(默认)'}`);
    return currentProvider;
  } catch (error) {
    console.error('[TrackingService] 获取车辆跟踪服务失败:', error.message);
    // 回退到默认 VehicleCompanyTracking
    const apiEndpoint = process.env.VEHICLE_COMPANY_API_ENDPOINT || 'https://api.vehicle-company.com';
    const authToken = process.env.VEHICLE_COMPANY_AUTH_TOKEN || 'default_token';
    currentProvider = new VehicleCompanyTracking({ apiEndpoint, authToken });
    return currentProvider;
  }
}

/**
 * 设置车辆跟踪服务提供商（用于测试）
 * @param {VehicleTrackingProvider} provider 车辆跟踪服务提供商实例
 */
function setTrackingService(provider) {
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
  getTrackingService,
  setTrackingService,
  reloadConfig
};
