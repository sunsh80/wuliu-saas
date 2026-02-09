// backend/api/handlers/carrier/pricing/createCarrierPricingConfig.js
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

  const db = getDb();
  
  // 驗证请求体
  const {
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
    active
  } = c.request.body;

  // 必填字段验证
  if (!config_name) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELD',
        message: '定价配置名称是必需的'
      }
    };
  }

  // 获取承运商ID
  const carrierTenantId = c.context.tenantId;

  try {
    // 插入新配置
    const result = await db.run(`
      INSERT INTO carrier_pricing_configs (
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
        active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1))
    `, [
      carrierTenantId,
      config_name,
      parseFloat(base_price) || 0.0,
      parseFloat(price_per_km) || 0.0,
      parseFloat(price_per_hour) || 0.0,
      parseFloat(price_per_kg) || 0.0,
      parseFloat(cold_storage_surcharge) || 0.0,
      parseFloat(peak_hour_multiplier) || 1.0,
      parseFloat(off_peak_hour_multiplier) || 1.0,
      parseFloat(weather_multiplier) || 1.0,
      parseFloat(min_price) || 0.0,
      parseFloat(max_price) || 999999.0,
      typeof time_slot_rules === 'object' ? JSON.stringify(time_slot_rules) : time_slot_rules,
      typeof region_rules === 'object' ? JSON.stringify(region_rules) : region_rules,
      typeof vehicle_type_rules === 'object' ? JSON.stringify(vehicle_type_rules) : vehicle_type_rules,
      pricing_strategy || 'distance_based',
      typeof service_addons === 'object' ? JSON.stringify(service_addons) : service_addons,
      active
    ]);

    // 返回新创建的配置
    const newConfig = await db.get(`
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
      WHERE id = ?
    `, [result.lastID]);

    return {
      statusCode: 201,
      body: {
        success: true,
        message: '承运商定价配置创建成功',
        data: newConfig
      }
    };
  } catch (error) {
    console.error('创建承运商定价配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '创建承运商定价配置失败'
      }
    };
  }
};