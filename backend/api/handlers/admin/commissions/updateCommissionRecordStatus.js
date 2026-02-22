// backend/api/handlers/admin/commissions/updateCommissionRecordStatus.js
const CommissionModel = require('../../../../db/models/Commission');
const { requireAuth } = require('../../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  const commissionModel = new CommissionModel();
  
  try {
    const { id } = c.request.params;
    const { status } = c.request.body;
    
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'INVALID_STATUS',
          message: '无效的状态值'
        }
      };
    }
    
    const paidDate = status === 'completed' ? new Date().toISOString() : null;
    const updated = await commissionModel.updateRecordStatus(id, status, paidDate);
    
    if (!updated) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到指定的抽佣记录'
        }
      };
    }
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: '抽佣记录状态已更新'
      }
    };
  } catch (error) {
    console.error('更新抽佣记录状态失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新抽佣记录状态失败'
      }
    };
  }
});
