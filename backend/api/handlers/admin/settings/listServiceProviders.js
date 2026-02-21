// backend/api/handlers/admin/settings/listServiceProviders.js
const ConfigService = require('../../../../services/ConfigService');

/**
 * 获取服务提供商配置列表
 */
module.exports = async (c) => {
  try {
    const { type } = c.request.query;

    let providers;
    if (type) {
      // 获取指定类型的服务提供商
      providers = await ConfigService.getEnabledProviders(type);
    } else {
      // 获取所有服务提供商（需要直接访问模型）
      const { models } = require('../../../../db');
      const serviceProviderModel = new models.ServiceProvider();
      providers = await serviceProviderModel.listAll();
      
      // 解析 config_json
      providers = providers.map(p => ({
        ...p,
        config_json: p.config_json ? JSON.parse(p.config_json) : null
      }));
    }

    return {
      status: 200,
      body: {
        success: true,
        data: providers
      }
    };
  } catch (error) {
    console.error('[API] 获取服务提供商配置列表失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取服务提供商配置列表失败：' + error.message
      }
    };
  }
};
