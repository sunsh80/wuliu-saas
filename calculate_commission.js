// backend/api/handlers/admin/commission/calculateCommission.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;

  console.log(`[calculateCommission] Calculating commission for order ${order_id}`);

  // 验证参数
  if (!order_id) {
    console.log('[calculateCommission] Missing required order_id parameter');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_ORDER_ID',
        message: 'Order ID is required'
      }
    };
  }

  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.log('[calculateCommission] Unauthorized: Admin role required');
    return { 
      status: 403, 
      body: { 
        success: false, 
        error: 'FORBIDDEN', 
        message: '需要管理员权限' 
      } 
    };
  }

  const db = getDb();

  try {
    // 1. 获取订单信息
    const order = await db.get(`
      SELECT 
        o.id,
        o.tracking_number,
        o.quote_price,
        o.total_price_with_addons,
        o.carrier_id,
        o.vehicle_id,
        o.customer_tenant_id,
        u.name as carrier_name,
        t.name as tenant_name
      FROM orders o
      LEFT JOIN users u ON o.carrier_id = u.id
      LEFT JOIN tenants t ON o.customer_tenant_id = t.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order) {
      console.log(`[calculateCommission] Order not found: ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }

    // 2. 获取车辆信息
    let vehicleInfo = null;
    if (order.vehicle_id) {
      vehicleInfo = await db.get(`
        SELECT 
          tv.id,
          tv.plate_number,
          tv.tenant_id as carrier_tenant_id,
          tv.current_active_orders,
          tv.max_active_orders,
          tv.penalty_points,
          tv.commission_increase_percent,
          tv.commission_increase_expiry,
          tv.status as vehicle_status
        FROM tenant_vehicles tv
        WHERE tv.id = ?
      `, [order.vehicle_id]);
    }

    // 3. 获取基础抽佣规则
    const baseRule = await db.get(`
      SELECT 
        id as rule_id,
        rule_name,
        base_commission_percent,
        min_commission_percent,
        max_commission_percent
      FROM commission_rules 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `) || {
      rule_id: null,
      rule_name: '默认规则',
      base_commission_percent: 10.0,
      min_commission_percent: 0.0,
      max_commission_percent: 50.0
    };

    // 4. 获取车辆特定的抽佣覆盖规则
    let vehicleOverride = null;
    if (vehicleInfo) {
      vehicleOverride = await db.get(`
        SELECT 
          id as override_id,
          override_type,
          override_value,
          reason,
          effective_from,
          effective_until
        FROM vehicle_commission_overrides
        WHERE vehicle_id = ? 
          AND is_active = 1
          AND datetime('now') BETWEEN effective_from AND COALESCE(effective_until, datetime('now', '+1 year'))
        ORDER BY created_at DESC
        LIMIT 1
      `, [order.vehicle_id]);
    }

    // 5. 计算最终抽佣比例
    let baseCommission = baseRule.base_commission_percent;
    let overrideCommission = null;
    let penaltyCommission = 0;
    let finalCommission = baseCommission;

    // 检查是否有车辆特定的覆盖规则
    if (vehicleOverride) {
      if (vehicleOverride.override_type === 'percentage') {
        overrideCommission = vehicleOverride.override_value;
        finalCommission = overrideCommission;
      } else if (vehicleOverride.override_type === 'fixed') {
        // 固定金额类型的覆盖需要根据订单金额计算百分比
        const orderAmount = order.total_price_with_addons || order.quote_price || 0;
        overrideCommission = orderAmount > 0 ? (vehicleOverride.override_value / orderAmount) * 100 : 0;
        finalCommission = overrideCommission;
      }
    }

    // 检查是否有因违规导致的抽佣增加
    if (vehicleInfo && vehicleInfo.commission_increase_percent) {
      const isPenaltyExpired = vehicleInfo.commission_increase_expiry && 
        new Date() > new Date(vehicleInfo.commission_increase_expiry);
      
      if (!isPenaltyExpired) {
        penaltyCommission = vehicleInfo.commission_increase_percent;
        // 如果没有覆盖规则，则在基础抽佣上增加
        if (overrideCommission === null) {
          finalCommission += penaltyCommission;
        }
      }
    }

    // 应用最小/最大限制
    finalCommission = Math.max(finalCommission, baseRule.min_commission_percent);
    finalCommission = Math.min(finalCommission, baseRule.max_commission_percent);

    // 6. 计算抽佣金额
    const orderAmount = order.total_price_with_addons || order.quote_price || 0;
    const commissionAmount = (orderAmount * finalCommission / 100);

    // 7. 记录抽佣历史
    await db.run(`
      INSERT INTO commission_history (
        order_id, vehicle_id, base_commission_percent, 
        override_commission_percent, final_commission_percent, 
        calculated_amount, applied_rule_id, adjustment_reason, 
        processed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      order.id,
      order.vehicle_id,
      baseCommission,
      overrideCommission,
      finalCommission,
      commissionAmount,
      baseRule.rule_id,
      `计算抽佣: 基础${baseCommission}%, 覆盖${overrideCommission||0}%, 违规增加${penaltyCommission}%`,
      c.context.id
    ]);

    // 8. 准备返回数据
    const commissionCalculation = {
      order: {
        id: order.id,
        tracking_number: order.tracking_number,
        amount: orderAmount,
        carrier_name: order.carrier_name,
        tenant_name: order.tenant_name
      },
      vehicle: vehicleInfo ? {
        id: vehicleInfo.id,
        plate_number: vehicleInfo.plate_number,
        status: vehicleInfo.vehicle_status,
        penalty_points: vehicleInfo.penalty_points
      } : null,
      rules: {
        base_rule: baseRule,
        vehicle_override: vehicleOverride
      },
      calculation_breakdown: {
        base_commission_percent: baseCommission,
        override_commission_percent: overrideCommission,
        penalty_commission_percent: penaltyCommission,
        final_commission_percent: finalCommission,
        commission_amount: commissionAmount
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[calculateCommission] Commission calculated for order ${order_id}: ${finalCommission}% = ${commissionAmount}`);

    return {
      status: 200,
      body: {
        success: true,
        message: 'Commission calculated successfully',
        data: commissionCalculation
      }
    };

  } catch (error) {
    console.error('[calculateCommission] Database error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while calculating commission'
      }
    };
  }
};