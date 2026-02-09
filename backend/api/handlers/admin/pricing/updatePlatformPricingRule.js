// backend/api/handlers/admin/pricing/updatePlatformPricingRule.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const ruleId = c.request.params.id;
  const db = getDb();
  
  // 驗证ID
  if (!ruleId || isNaN(ruleId)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_RULE_ID',
        message: '无效的定价规则ID'
      }
    };
  }

  // 驗证请求体
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

  try {
    // 检查规则是否存在
    const existingRule = await db.get('SELECT id FROM platform_pricing_rules WHERE id = ?', [ruleId]);
    if (!existingRule) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'RULE_NOT_FOUND',
          message: '未找到指定的定价规则'
        }
      };
    }

    // 更新规则
    await db.run(`
      UPDATE platform_pricing_rules
      SET
        rule_name = COALESCE(?, rule_name),
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
        active = COALESCE(?, active),
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      rule_name,
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
      active,
      ruleId
    ]);

    // 返回更新后的规则
    const updatedRule = await db.get(`
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
    `, [ruleId]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '平台定价规则更新成功',
        data: updatedRule
      }
    };
  } catch (error) {
    console.error('更新平台定价规则失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '更新平台定价规则失败'
      }
    };
  }
};