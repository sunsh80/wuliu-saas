// backend/services/business/MapService.js
const TencentMap = require('../providers/TencentMap');
const BaiduMap = require('../providers/BaiduMap');
const ConfigService = require('../ConfigService');

let currentProvider = null;
let providerCache = null;
let lastProviderCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

/**
 * 获取当前地图服务提供商（异步，从数据库读取配置）
 * @returns {Promise<MapProvider>} 地图服务提供商实例
 */
async function getMapService() {
  const now = Date.now();
  
  // 检查缓存是否过期
  if (providerCache && (now - lastProviderCheck) < CACHE_TTL) {
    return providerCache;
  }

  try {
    // 从数据库获取默认提供商
    const defaultProvider = await ConfigService.getDefaultProvider('map');
    
    if (!defaultProvider) {
      // 如果数据库没有配置，使用默认腾讯地图
      const apiKey = process.env.TENCENT_MAP_API_KEY || 'default_key';
      providerCache = new TencentMap({ apiKey });
    } else if (defaultProvider.provider_name === 'TencentMap') {
      providerCache = new TencentMap({ 
        apiKey: defaultProvider.api_key || process.env.TENCENT_MAP_API_KEY || 'default_key' 
      });
    } else if (defaultProvider.provider_name === 'BaiduMap') {
      providerCache = new BaiduMap({ 
        apiKey: defaultProvider.api_key || process.env.BAIDU_MAP_API_KEY || 'default_key' 
      });
    } else {
      // 未知提供商，回退到腾讯地图
      const apiKey = process.env.TENCENT_MAP_API_KEY || 'default_key';
      providerCache = new TencentMap({ apiKey });
    }

    currentProvider = providerCache;
    lastProviderCheck = now;
    console.log(`[MapService] 使用地图提供商：${defaultProvider ? defaultProvider.provider_name : 'TencentMap(默认)'}`);
    return currentProvider;
  } catch (error) {
    console.error('[MapService] 获取地图服务失败:', error.message);
    // 回退到默认腾讯地图
    const apiKey = process.env.TENCENT_MAP_API_KEY || 'default_key';
    currentProvider = new TencentMap({ apiKey });
    return currentProvider;
  }
}

/**
 * 获取当前地图服务提供商（同步版本，用于兼容）
 * @returns {MapProvider} 地图服务提供商实例
 */
function getMapServiceSync() {
  if (!currentProvider) {
    // 首次调用时使用环境变量
    const providerName = process.env.MAP_PROVIDER || 'TencentMap';
    
    if (providerName === 'TencentMap') {
      currentProvider = new TencentMap({ apiKey: process.env.TENCENT_MAP_API_KEY || 'default_key' });
    } else if (providerName === 'BaiduMap') {
      currentProvider = new BaiduMap({ apiKey: process.env.BAIDU_MAP_API_KEY || 'default_key' });
    } else {
      currentProvider = new TencentMap({ apiKey: process.env.TENCENT_MAP_API_KEY || 'default_key' });
    }
  }
  return currentProvider;
}

/**
 * 设置地图服务提供商（用于测试）
 * @param {MapProvider} provider 地图服务提供商实例
 */
function setMapService(provider) {
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
  getMapService,
  getMapServiceSync,
  setMapService,
  reloadConfig
};