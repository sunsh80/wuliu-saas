// backend/api/handlers/admin/pricing/createPlatformPricingRule.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const db = getDb();
  
  // 验证请求体
  const {
    rule_name,
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
    active
  } = c.request.body;

  // 必填字段验证
  if (!rule_name) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELD',
        message: '定价规则名称是必需的'
      }
    };
  }

  try {
    // 插入新规则
    const result = await db.run(`
      INSERT INTO platform_pricing_rules (
        rule_name,
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
        active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1))
    `, [
      rule_name,
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
      active
    ]);

    // 返回新创建的规则
    const newRule = await db.get(`
      SELECT
        id,
        rule_name,
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
        active,
        created_at,
        updated_at
      FROM platform_pricing_rules
      WHERE id = ?
    `, [result.lastID]);

    return {
      statusCode: 201,
      body: {
        success: true,
        message: '平台定价规则创建成功',
        data: newRule
      }
    };
  } catch (error) {
    console.error('创建平台定价规则失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '创建平台定价规则失败'
      }
    };
  }
};