// backend/api/handlers/admin/violations/updateViolation.js
const ViolationModel = require('../../../../db/models/Violation');
const { requireAuth } = require('../../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  const violationModel = new ViolationModel();
  
  try {
    const { id } = c.request.params;
    const updates = c.request.body;
    
    if (!id || isNaN(id)) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'INVALID_ID',
          message: '无效的违规记录 ID'
        }
      };
    }
    
    const updated = await violationModel.update(id, updates);
    
    if (!updated) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到指定的违规记录'
        }
      };
    }
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: '违规记录已更新'
      }
    };
  } catch (error) {
    console.error('更新违规记录失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新违规记录失败'
      }
    };
  }
});
