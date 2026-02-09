// backend/api/handlers/carrier/pricing/updateCarrierPricingConfig.js
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

    // 更新配置
    await db.run(`
      UPDATE carrier_pricing_configs
      SET
        config_name = COALESCE(?, config_name),
        base_price = COALESCE(?, base_price),
        price_per_km = COALESCE(?, price_per_km),
        price_per_hour = COALESCE(?, price_per_hour),
        price_per_kg = COALESCE(?, price_per_kg),
        cold_storage_surcharge = COALESCE(?, cold_storage_surcharge),
        peak_hour_multiplier = COALESCE(?, peak_hour_multiplier),
        off_peak_hour_multiplier = COALESCE(?, off_peak_hour_multiplier),
        weather_multiplier = COALESCE(?, weather_multiplier),
        min_price = COALESCE(?, min_price),
        max_price = COALESCE(?, max_price),
        time_slot_rules = CASE WHEN ? IS NULL THEN time_slot_rules ELSE ? END,
        region_rules = CASE WHEN ? IS NULL THEN region_rules ELSE ? END,
        vehicle_type_rules = CASE WHEN ? IS NULL THEN vehicle_type_rules ELSE ? END,
        pricing_strategy = COALESCE(?, pricing_strategy),
        service_addons = CASE WHEN ? IS NULL THEN service_addons ELSE ? END,
        active = COALESCE(?, active),
        updated_at = datetime('now')
      WHERE id = ? AND carrier_tenant_id = ?
    `, [
      config_name,
      parseFloat(base_price) || null,
      parseFloat(price_per_km) || null,
      parseFloat(price_per_hour) || null,
      parseFloat(price_per_kg) || null,
      parseFloat(cold_storage_surcharge) || null,
      parseFloat(peak_hour_multiplier) || null,
      parseFloat(off_peak_hour_multiplier) || null,
      parseFloat(weather_multiplier) || null,
      parseFloat(min_price) || null,
      parseFloat(max_price) || null,
      time_slot_rules !== undefined ? 1 : null, // 检查是否提供了值
      typeof time_slot_rules === 'object' ? JSON.stringify(time_slot_rules) : time_slot_rules,
      region_rules !== undefined ? 1 : null,
      typeof region_rules === 'object' ? JSON.stringify(region_rules) : region_rules,
      vehicle_type_rules !== undefined ? 1 : null,
      typeof vehicle_type_rules === 'object' ? JSON.stringify(vehicle_type_rules) : vehicle_type_rules,
      pricing_strategy,
      service_addons !== undefined ? 1 : null,
      typeof service_addons === 'object' ? JSON.stringify(service_addons) : service_addons,
      active,
      configId,
      carrierTenantId
    ]);

    // 返回更新后的配置
    const updatedConfig = await db.get(`
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
    `, [configId]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '承运商定价配置更新成功',
        data: updatedConfig
      }
    };
  } catch (error) {
    console.error('更新承运商定价配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新承运商定价配置失败'
      }
    };
  }
};