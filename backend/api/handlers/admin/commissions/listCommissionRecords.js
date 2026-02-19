// backend/api/handlers/admin/commissions/listCommissionRecords.js
const CommissionModel = require('../../../../db/models/Commission');

module.exports = async (c) => {
  const commissionModel = new CommissionModel();
  
  try {
    const { order_id, status } = c.request.query;
    
    const filters = {};
    if (order_id) filters.order_id = order_id;
    if (status) filters.status = status;
    
    const records = await commissionModel.listRecords(filters);
    const stats = await commissionModel.getStats();
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          records,
          total: records.length,
          stats
        }
      }
    };
  } catch (error) {
    console.error('获取抽佣记录列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取抽佣记录列表失败'
      }
    };
  }
};
