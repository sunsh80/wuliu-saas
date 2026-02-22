// backend/api/handlers/admin/commissions/updateCommissionConfig.js
const CommissionModel = require('../../../../db/models/Commission');
const { requireAuth } = require('../../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  const commissionModel = new CommissionModel();
  
  try {
    const { id } = c.request.params;
    const { platform_rate, carrier_rate, min_amount, max_amount, notes, tiers } = c.request.body;
    
    // 更新主配置
    const updates = {};
    if (platform_rate !== undefined) updates.platform_rate = platform_rate;
    if (carrier_rate !== undefined) updates.carrier_rate = carrier_rate;
    if (min_amount !== undefined) updates.min_amount = min_amount;
    if (max_amount !== undefined) updates.max_amount = max_amount;
    if (notes !== undefined) updates.notes = notes;
    
    const updated = await commissionModel.updateConfig(id, updates);
    
    // 更新分级配置
    if (tiers && Array.isArray(tiers)) {
      for (const tier of tiers) {
        if (tier.id) {
          await commissionModel.updateTier(tier.id, tier);
        } else {
          await commissionModel.createTier({ ...tier, config_id: id });
        }
      }
    }
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: '抽佣配置已更新'
      }
    };
  } catch (error) {
    console.error('更新抽佣配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新抽佣配置失败'
      }
    };
  }
});
