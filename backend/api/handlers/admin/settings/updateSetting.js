// backend/api/handlers/admin/settings/updateSetting.js
const SystemSettingModel = require('../../../../db/models/SystemSetting');

module.exports = async (c) => {
  const settingModel = new SystemSettingModel();
  
  try {
    const { id } = c.request.params;
    const { value, description, is_public } = c.request.body;
    
    const updates = {};
    if (value !== undefined) updates.value = value;
    if (description !== undefined) updates.description = description;
    if (is_public !== undefined) updates.is_public = is_public;
    
    const updated = await settingModel.update(id, updates);
    
    if (!updated) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到指定的设置项'
        }
      };
    }
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: '系统设置已更新'
      }
    };
  } catch (error) {
    console.error('更新系统设置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新系统设置失败'
      }
    };
  }
};
