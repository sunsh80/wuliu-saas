// backend/services/ConfigService.js
const { models } = require('../db');

/**
 * 配置服务模块
 * 提供统一的配置读取接口，支持从数据库读取配置
 */
class ConfigService {
  constructor() {
    this.systemSettingModel = new models.SystemSetting();
    this.serviceProviderModel = new models.ServiceProvider();
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 分钟缓存
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键
   * @param {any} defaultValue - 默认值
   * @returns {Promise<any>} 配置值
   */
  async getConfig(key, defaultValue = null) {
    // 检查缓存
    const cached = this._getFromCache(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await this.systemSettingModel.getConfig(key, defaultValue);
      this._setCache(key, value);
      return value;
    } catch (error) {
      console.error(`[ConfigService] 获取配置 ${key} 失败:`, error.message);
      return defaultValue;
    }
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @param {string} type - 数据类型
   * @param {string} description - 描述
   * @param {string} category - 分类
   * @returns {Promise<object>} 配置记录
   */
  async setConfig(key, value, type = 'string', description = '', category = 'general') {
    try {
      const result = await this.systemSettingModel.setConfig(key, value, type, description, category);
      this._invalidateCache(key);
      return result;
    } catch (error) {
      console.error(`[ConfigService] 设置配置 ${key} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取服务提供商配置
   * @param {string} type - 服务类型 (map, route, tracking)
   * @param {string} name - 提供商名称
   * @returns {Promise<object|null>} 服务提供商配置
   */
  async getProviderConfig(type, name) {
    try {
      const provider = await this.serviceProviderModel.findByName(name);
      if (!provider || provider.provider_type !== type) {
        return null;
      }

      // 解析 config_json
      if (provider.config_json) {
        try {
          provider.config_json = JSON.parse(provider.config_json);
        } catch (e) {
          provider.config_json = null;
        }
      }

      return provider;
    } catch (error) {
      console.error(`[ConfigService] 获取服务提供商配置 ${type}/${name} 失败:`, error.message);
      return null;
    }
  }

  /**
   * 获取默认服务提供商
   * @param {string} type - 服务类型 (map, route, tracking)
   * @returns {Promise<object|null>} 服务提供商配置
   */
  async getDefaultProvider(type) {
    try {
      // 首先从系统配置获取默认提供商名称
      const defaultProviderKey = `${type}.defaultProvider`;
      const defaultProviderName = await this.getConfig(defaultProviderKey);

      if (defaultProviderName) {
        const provider = await this.getProviderConfig(type, defaultProviderName);
        if (provider && provider.is_enabled) {
          return provider;
        }
      }

      // 如果没有指定默认值，获取第一个启用的提供商
      const provider = await this.serviceProviderModel.getDefaultProvider(type);
      if (provider) {
        if (provider.config_json) {
          try {
            provider.config_json = JSON.parse(provider.config_json);
          } catch (e) {
            provider.config_json = null;
          }
        }
        return provider;
      }

      return null;
    } catch (error) {
      console.error(`[ConfigService] 获取默认服务提供商 ${type} 失败:`, error.message);
      return null;
    }
  }

  /**
   * 获取所有启用的服务提供商
   * @param {string} type - 服务类型
   * @returns {Promise<Array>} 服务提供商列表
   */
  async getEnabledProviders(type) {
    try {
      const providers = await this.serviceProviderModel.getEnabledByType(type);
      return providers.map(p => ({
        ...p,
        config_json: p.config_json ? JSON.parse(p.config_json) : null
      }));
    } catch (error) {
      console.error(`[ConfigService] 获取服务提供商列表 ${type} 失败:`, error.message);
      return [];
    }
  }

  /**
   * 更新服务提供商配置
   * @param {string} name - 提供商名称
   * @param {string} type - 服务类型
   * @param {object} updates - 更新内容
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateProviderConfig(name, type, updates) {
    try {
      const result = await this.serviceProviderModel.updateConfig(name, type, updates);
      this._invalidateCache(`${type}.${name}`);
      return result;
    } catch (error) {
      console.error(`[ConfigService] 更新服务提供商配置 ${type}/${name} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取所有系统配置（分组）
   * @returns {Promise<object>} 分组的配置
   */
  async getAllSettings() {
    try {
      return await this.systemSettingModel.getSettingsGrouped();
    } catch (error) {
      console.error('[ConfigService] 获取所有配置失败:', error.message);
      return {};
    }
  }

  /**
   * 按分类获取配置
   * @param {string} category - 分类
   * @returns {Promise<Array>} 配置列表
   */
  async getSettingsByCategory(category) {
    try {
      return await this.systemSettingModel.listByCategory(category);
    } catch (error) {
      console.error(`[ConfigService] 获取分类配置 ${category} 失败:`, error.message);
      return [];
    }
  }

  /**
   * 获取公开配置
   * @returns {Promise<Array>} 公开配置列表
   */
  async getPublicSettings() {
    try {
      return await this.systemSettingModel.listPublic();
    } catch (error) {
      console.error('[ConfigService] 获取公开配置失败:', error.message);
      return [];
    }
  }

  /**
   * 从缓存获取
   * @private
   */
  _getFromCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this._invalidateCache(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  /**
   * 设置缓存
   * @private
   */
  _setCache(key, value) {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.cacheTTL);
  }

  /**
   * 使缓存失效
   * @private
   */
  _invalidateCache(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// 导出单例
module.exports = new ConfigService();
