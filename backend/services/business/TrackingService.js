// backend/services/business/TrackingService.js
const VehicleCompanyTracking = require('../providers/VehicleCompanyTracking');
const config = require('../../config/tracking');

let currentProvider = null;

/**
 * 获取当前车辆跟踪服务提供商
 * @returns {VehicleTrackingProvider} 车辆跟踪服务提供商实例
 */
function getTrackingService() {
  if (!currentProvider) {
    const providerName = config.defaultProvider;
    
    if (providerName === 'VehicleCompanyTracking' && config.providers.VehicleCompanyTracking.enabled) {
      currentProvider = new VehicleCompanyTracking({ 
        apiEndpoint: config.providers.VehicleCompanyTracking.apiEndpoint,
        authToken: config.providers.VehicleCompanyTracking.authToken
      });
    } else {
      // 默认使用VehicleCompanyTracking
      currentProvider = new VehicleCompanyTracking({ 
        apiEndpoint: process.env.VEHICLE_COMPANY_API_ENDPOINT || 'https://api.vehicle-company.com',
        authToken: process.env.VEHICLE_COMPANY_AUTH_TOKEN || 'default_token'
      });
    }
  }
  
  return currentProvider;
}

/**
 * 设置车辆跟踪服务提供商
 * @param {VehicleTrackingProvider} provider 车辆跟踪服务提供商实例
 */
function setTrackingService(provider) {
  currentProvider = provider;
}

module.exports = {
  getTrackingService,
  setTrackingService
};