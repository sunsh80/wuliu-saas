// backend/api/handlers/carrier/commission/getVehicleCommissionInfo.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商获取车辆抽佣信息处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to get vehicle commission info for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  // 检查角色
  if (!c.context.roles.includes('carrier')) {
    console.log("User does not have 'carrier' role.");
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 获取承运商的所有车辆及其抽佣信息
    const vehiclesWithCommission = await db.all(`
      SELECT 
        v.id as vehicle_id,
        v.plate_number,
        v.type as vehicle_type,
        v.max_weight,
        v.volume,
        v.status as vehicle_status,
        -- 获取基础抽佣规则
        cr.base_commission_percent as base_commission_percent,
        cr.rule_name as base_rule_name,
        -- 获取车辆特定的抽佣覆盖
        vco.override_value as override_commission_percent,
        vco.override_type,
        vco.reason as override_reason,
        vco.effective_from as override_effective_from,
        vco.effective_until as override_effective_until,
        -- 获取因违规导致的抽佣增加
        tv.penalty_points,
        tv.commission_increase_percent,
        tv.commission_increase_expiry,
        -- 计算最终抽佣比例
        CASE 
          WHEN vco.override_value IS NOT NULL THEN vco.override_value
          WHEN tv.commission_increase_percent IS NOT NULL THEN 
            COALESCE(cr.base_commission_percent, 10.0) + tv.commission_increase_percent
          ELSE COALESCE(cr.base_commission_percent, 10.0)
        END as final_commission_percent,
        -- 获取当前活跃订单数
        v.current_active_orders,
        v.max_active_orders,
        -- 获取车辆状态信息
        CASE 
          WHEN tv.penalty_expiry_time IS NOT NULL AND datetime('now') < tv.penalty_expiry_time 
          THEN 'under_penalty'
          ELSE 'normal'
        END as penalty_status,
        -- 获取最近的违规记录
        (SELECT vr.violation_type 
         FROM violation_records vr 
         WHERE vr.vehicle_id = v.id 
         ORDER BY vr.created_at DESC 
         LIMIT 1) as latest_violation_type,
        (SELECT vr.created_at 
         FROM violation_records vr 
         WHERE vr.vehicle_id = v.id 
         ORDER BY vr.created_at DESC 
         LIMIT 1) as latest_violation_date
      FROM tenant_vehicles v
      JOIN users u ON v.tenant_id = u.tenant_id
      -- 关联基础抽佣规则
      LEFT JOIN commission_rules cr ON cr.is_active = 1
      -- 关联车辆特定抽佣覆盖
      LEFT JOIN vehicle_commission_overrides vco ON vco.vehicle_id = v.id 
        AND vco.is_active = 1 
        AND datetime('now') BETWEEN vco.effective_from AND COALESCE(vco.effective_until, datetime('now', '+1 year'))
      -- 关联车辆处罚信息
      LEFT JOIN tenant_vehicles tv ON tv.id = v.id
      WHERE u.id = ?
      ORDER BY v.current_active_orders ASC, v.plate_number
    `, [userId]);

    // 处理数据，计算更多信息
    const processedVehicles = vehiclesWithCommission.map(vehicle => {
      // 检查是否有有效的抽佣覆盖
      const hasValidOverride = vehicle.override_value !== null && 
        new Date() >= new Date(vehicle.override_effective_from) &&
        (!vehicle.override_effective_until || new Date() <= new Date(vehicle.override_effective_until));
      
      // 检查处罚是否过期
      const isPenaltyExpired = vehicle.commission_increase_expiry && 
        new Date() > new Date(vehicle.commission_increase_expiry);
      
      // 计算当前有效的抽佣比例
      let currentEffectiveCommission = vehicle.base_commission_percent || 10.0;
      
      if (hasValidOverride) {
        // 如果有有效的覆盖规则，使用覆盖值
        currentEffectiveCommission = vehicle.override_value;
      } else if (vehicle.commission_increase_percent && !isPenaltyExpired) {
        // 如果有未过期的处罚增加，加上处罚增加的比例
        currentEffectiveCommission += vehicle.commission_increase_percent;
      }
      
      return {
        ...vehicle,
        current_effective_commission: currentEffectiveCommission,
        has_valid_override: hasValidOverride,
        is_penalty_expired: isPenaltyExpired,
        utilization_rate: vehicle.max_active_orders > 0 ? 
          (vehicle.current_active_orders / vehicle.max_active_orders * 100).toFixed(2) + '%' : '0%',
        status_summary: {
          penalty_status: vehicle.penalty_status,
          active_orders: vehicle.current_active_orders,
          max_allowed: vehicle.max_active_orders,
          override_status: hasValidOverride ? 'active_override' : 'base_rule',
          commission_increase_remaining: vehicle.commission_increase_expiry ? 
            Math.max(0, Math.ceil((new Date(vehicle.commission_increase_expiry) - new Date()) / (1000 * 60 * 60 * 24))) + '天' : 'none'
        }
      };
    });

    // 获取系统默认抽佣规则
    const defaultRule = await db.get(`
      SELECT base_commission_percent, rule_name, min_commission_percent, max_commission_percent
      FROM commission_rules 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `) || { base_commission_percent: 10.0, rule_name: '默认规则', min_commission_percent: 0.0, max_commission_percent: 50.0 };

    return {
      status: 200,
      body: {
        success: true,
        message: '获取车辆抽佣信息成功',
        data: {
          vehicles: processedVehicles,
          system_default_rule: defaultRule,
          summary: {
            total_vehicles: processedVehicles.length,
            vehicles_with_overrides: processedVehicles.filter(v => v.has_valid_override).length,
            vehicles_under_penalty: processedVehicles.filter(v => v.penalty_status === 'under_penalty').length,
            average_commission: processedVehicles.length > 0 ? 
              (processedVehicles.reduce((sum, v) => sum + v.current_effective_commission, 0) / processedVehicles.length).toFixed(2) : 0
          }
        }
      }
    };

  } catch (error) {
    console.error('💥 [GET VEHICLE COMMISSION INFO HANDLER ERROR]:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR', 
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' 
      } 
    };
  }
};