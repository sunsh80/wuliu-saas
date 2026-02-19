// backend/api/handlers/admin/commissions/getCommissionConfig.js
const CommissionModel = require('../../../../db/models/Commission');

module.exports = async (c) => {
  const commissionModel = new CommissionModel();
  
  try {
    const config = await commissionModel.getCurrentConfig();
    
    if (!config) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '未找到抽佣配置'
        }
      };
    }
    
    // 获取分级配置
    const tiers = await commissionModel.listTiers(config.id);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...config,
          tiers
        }
      }
    };
  } catch (error) {
    console.error('获取抽佣配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取抽佣配置失败'
      }
    };
  }
};
