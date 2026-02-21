// backend/api/handlers/admin/settings/updateServiceProvider.js
const ConfigService = require('../../../../services/ConfigService');

/**
 * 更新服务提供商配置
 */
module.exports = async (c) => {
  try {
    const { id } = c.request.params;
    const {
      api_endpoint,
      api_key,
      auth_token,
      is_enabled,
      config_json,
      priority
    } = c.request.body;

    const updates = {};
    if (api_endpoint !== undefined) updates.api_endpoint = api_endpoint;
    if (api_key !== undefined) updates.api_key = api_key;
    if (auth_token !== undefined) updates.auth_token = auth_token;
    if (is_enabled !== undefined) updates.is_enabled = is_enabled;
    if (config_json !== undefined) updates.config_json = config_json;
    if (priority !== undefined) updates.priority = priority;

    const { models } = require('../../../../db');
    const serviceProviderModel = new models.ServiceProvider();
    const updated = await serviceProviderModel.update(id, updates);

    if (!updated) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到指定的服务提供商配置'
        }
      };
    }

    // 清除配置缓存
    ConfigService.clearCache();

    return {
      status: 200,
      body: {
        success: true,
        message: '服务提供商配置已更新'
      }
    };
  } catch (error) {
    console.error('[API] 更新服务提供商配置失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新服务提供商配置失败：' + error.message
      }
    };
  }
};
