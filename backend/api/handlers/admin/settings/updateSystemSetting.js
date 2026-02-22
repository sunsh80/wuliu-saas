// backend/api/handlers/admin/settings/updateSystemSetting.js
const ConfigService = require('../../../../services/ConfigService');
const { requireAuth } = require('../../../../utils/requireAuth');

/**
 * 更新系统配置
 */
module.exports = requireAuth(async (c) => {
  try {
    const { id } = c.request.params;
    const { config_value, description, is_public, is_enabled } = c.request.body;

    const updates = {};
    if (config_value !== undefined) updates.config_value = config_value;
    if (description !== undefined) updates.description = description;
    if (is_public !== undefined) updates.is_public = is_public;
    if (is_enabled !== undefined) updates.is_enabled = is_enabled;

    const { models } = require('../../../../db');
    const systemSettingModel = new models.SystemSetting();
    const updated = await systemSettingModel.update(id, updates);

    if (!updated) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到指定的配置项'
        }
      };
    }

    // 清除配置缓存
    ConfigService.clearCache();

    return {
      status: 200,
      body: {
        success: true,
        message: '系统配置已更新'
      }
    };
  } catch (error) {
    console.error('[API] 更新系统配置失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新系统配置失败：' + error.message
      }
    };
  }
});
