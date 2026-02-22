// backend/api/handlers/admin/settings/setConfigValue.js
const ConfigService = require('../../../../services/ConfigService');
const { requireAuth } = require('../../../../utils/requireAuth');

/**
 * 设置配置值（快捷方式）
 * 直接通过 key 设置配置值，如果不存在则创建
 */
module.exports = requireAuth(async (c) => {
  try {
    const { key } = c.request.params;
    const { value, type, description, category } = c.request.body;

    if (!key) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_KEY',
          message: '配置键不能为空'
        }
      };
    }

    if (value === undefined) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_VALUE',
          message: '配置值不能为空'
        }
      };
    }

    // 设置配置
    await ConfigService.setConfig(
      key,
      value,
      type || 'string',
      description || '',
      category || 'general'
    );

    // 清除配置缓存
    ConfigService.clearCache();

    return {
      status: 200,
      body: {
        success: true,
        message: '配置已设置',
        data: { key, value, type, description, category }
      }
    };
  } catch (error) {
    console.error('[API] 设置配置值失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '设置配置值失败：' + error.message
      }
    };
  }
});
