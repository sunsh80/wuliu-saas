// backend/api/handlers/admin/violations/getViolationStats.js
const ViolationModel = require('../../../../db/models/Violation');
const { requireAuth } = require('../../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  const violationModel = new ViolationModel();
  
  try {
    const stats = await violationModel.getStats();
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: stats
      }
    };
  } catch (error) {
    console.error('获取违规统计数据失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取违规统计数据失败'
      }
    };
  }
});
