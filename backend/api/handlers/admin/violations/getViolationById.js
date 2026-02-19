// backend/api/handlers/admin/violations/getViolationById.js
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
    
    const violation = await violationModel.findById(id);
    
    if (!violation) {
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
        data: violation
      }
    };
  } catch (error) {
    console.error('获取违规记录详情失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取违规记录详情失败'
      }
    };
  }
};
