// backend/api/handlers/carrier/pricing/getCarrierPricingConfig.js
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
  
  try {
    // 验證ID是否为有效数字
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

    // 获取承运商ID
    const carrierTenantId = c.context.tenantId;

    const config = await db.get(`
      SELECT
        id,
        carrier_tenant_id,
        config_name,
        base_price,
        price_per_km,
        price_per_hour,
        price_per_kg,
        cold_storage_surcharge,
        peak_hour_multiplier,
        off_peak_hour_multiplier,
        weather_multiplier,
        min_price,
        max_price,
        time_slot_rules,
        region_rules,
        vehicle_type_rules,
        pricing_strategy,
        service_addons,
        active,
        created_at,
        updated_at
      FROM carrier_pricing_configs
      WHERE id = ? AND carrier_tenant_id = ?
    `, [configId, carrierTenantId]);

    if (!config) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'CONFIG_NOT_FOUND',
          message: '未找到指定的定价配置或该配置不属于当前承运商'
        }
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        data: config
      }
    };
  } catch (error) {
    console.error('获取承运商定价配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取承运商定价配置失败'
      }
    };
  }
};