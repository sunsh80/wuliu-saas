// backend/api/handlers/carrier/pricing/deleteCarrierPricingConfig.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  // 检查用户权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('carrier')) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'FORBIDDEN',
        message: '只有承运商可以访问此资源'
      }
    };
  }

  const configId = c.request.params.id;
  const db = getDb();
  
  // 验證ID
  if (!configId || isNaN(configId)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_CONFIG_ID',
        message: '无效的定价配置ID'
      }
    };
  }

  try {
    // 获取承运商ID
    const carrierTenantId = c.context.tenantId;

    // 检查配置是否存在且属于当前承运商
    const existingConfig = await db.get('SELECT id FROM carrier_pricing_configs WHERE id = ? AND carrier_tenant_id = ?', [configId, carrierTenantId]);
    if (!existingConfig) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'CONFIG_NOT_FOUND',
          message: '未找到指定的定价配置或该配置不属于当前承运商'
        }
      };
    }

    // 删除配置
    await db.run('DELETE FROM carrier_pricing_configs WHERE id = ? AND carrier_tenant_id = ?', [configId, carrierTenantId]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '承运商定价配置删除成功'
      }
    };
  } catch (error) {
    console.error('删除承运商定价配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '删除承运商定价配置失败'
      }
    };
  }
};