// backend/api/handlers/admin/violations/deleteViolation.js
const ViolationModel = require('../../../../db/models/Violation');

module.exports = async (c) => {
  const violationModel = new ViolationModel();
  
  try {
    const { id } = c.request.params;
    
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
    
    const deleted = await violationModel.delete(id);
    
    if (!deleted) {
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
        message: '违规记录已删除'
      }
    };
  } catch (error) {
    console.error('删除违规记录失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '删除违规记录失败'
      }
    };
  }
};
