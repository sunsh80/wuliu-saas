// backend/api/handlers/admin/pricing/getPlatformPricingRule.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const ruleId = c.request.params.id;
  const db = getDb();
  
  try {
    // 验证ID是否为有效数字
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

    const rule = await db.get(`
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

    if (!rule) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'RULE_NOT_FOUND',
          message: '未找到指定的定价规则'
        }
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        data: rule
      }
    };
  } catch (error) {
    console.error('获取平台定价规则失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取平台定价规则失败'
      }
    };
  }
};