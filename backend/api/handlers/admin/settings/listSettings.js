// backend/api/handlers/admin/settings/listSettings.js
const SystemSettingModel = require('../../../../db/models/SystemSetting');

module.exports = async (c) => {
  const settingModel = new SystemSettingModel();
  
  try {
    const { category } = c.request.query;
    
    let settings;
    if (category) {
      settings = await settingModel.listByCategory(category);
    } else {
      settings = await settingModel.getSettingsGrouped();
    }
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: settings
      }
    };
  } catch (error) {
    console.error('获取系统设置列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取系统设置列表失败'
      }
    };
  }
};
