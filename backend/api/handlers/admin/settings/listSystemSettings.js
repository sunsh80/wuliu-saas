// backend/api/handlers/admin/settings/listSystemSettings.js
const ConfigService = require('../../../../services/ConfigService');
const { requireAuth } = require('../../../../utils/requireAuth');

/**
 * 获取系统配置列表
 * 支持按分类查询，支持获取所有配置（分组）
 */
module.exports = requireAuth(async (c) => {
  try {
    const { category, grouped } = c.request.query;

    let settings;
    if (grouped === 'true') {
      // 获取分组的配置
      settings = await ConfigService.getAllSettings();
    } else if (category) {
      // 获取指定分类的配置
      settings = await ConfigService.getSettingsByCategory(category);
    } else {
      // 获取所有配置（列表）
      settings = await ConfigService.getAllSettings();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: settings
      }
    };
  } catch (error) {
    console.error('[API] 获取系统配置列表失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取系统配置列表失败：' + error.message
      }
    };
  }
});
