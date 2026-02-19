// backend/services/business/MapService.js
const TencentMap = require('../providers/TencentMap');
const BaiduMap = require('../providers/BaiduMap');
const config = require('../../config/map');

let currentProvider = null;

/**
 * 获取当前地图服务提供商
 * @returns {MapProvider} 地图服务提供商实例
 */
function getMapService() {
  if (!currentProvider) {
    const providerName = config.defaultProvider;
    
    if (providerName === 'TencentMap' && config.providers.TencentMap.enabled) {
      currentProvider = new TencentMap({ apiKey: config.providers.TencentMap.apiKey });
    } else if (providerName === 'BaiduMap' && config.providers.BaiduMap.enabled) {
      currentProvider = new BaiduMap({ apiKey: config.providers.BaiduMap.apiKey });
    } else {
      // 默认使用腾讯地图
      currentProvider = new TencentMap({ apiKey: process.env.TENCENT_MAP_API_KEY || 'default_key' });
    }
  }
  
  return currentProvider;
}

/**
 * 设置地图服务提供商
 * @param {MapProvider} provider 地图服务提供商实例
 */
function setMapService(provider) {
  currentProvider = provider;
}

module.exports = {
  getMapService,
  setMapService
};