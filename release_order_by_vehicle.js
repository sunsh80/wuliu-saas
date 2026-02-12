// backend/api/handlers/carrier/order/releaseOrderByVehicle.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商使用指定车辆释放订单处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to release order by vehicle for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const order_id = c.request.params.order_id;
  const { vehicle_id } = c.request.body; // 从请求体获取车辆ID

  if (!order_id) {
    console.warn("⚠️ Missing order_id in path parameters");
    return { status: 400, body: { success: false, error: 'MISSING_ORDER_ID' } };
  }

  if (!vehicle_id) {
    console.warn("⚠️ Missing vehicle_id in request body");
    return { status: 400, body: { success: false, error: 'MISSING_VEHICLE_ID' } };
  }

  // 检查角色
  if (!c.context.roles.includes('carrier')) {
    console.log("User does not have 'carrier' role.");
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 1. 检查订单是否存在，是否由该承运商的该车辆认领
    console.log(`🔍 [STEP 1] Checking order ${order_id} for release eligibility by vehicle ${vehicle_id}`);
    const orderCheck = await db.get(`
      SELECT id, status, carrier_id, vehicle_id as assigned_vehicle_id, tracking_number 
      FROM orders 
      WHERE id = ? AND carrier_id = ? AND vehicle_id = ?
    `, [order_id, userId, vehicle_id]);

    if (!orderCheck) {
      console.log("❌ Order not found or not assigned to carrier's vehicle:", order_id);
      return { 
        status: 404, 
        body: { 
          success: false, 
          error: 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED_TO_VEHICLE',
          message: '订单不存在或未分配给当前承运商的指定车辆'
        } 
      };
    }

    // 2. 根据订单状态判断违规类型
    let violationType = null;
    let violationDescription = '';
    let penaltyPoints = 0;
    let penaltyDurationMinutes = 0;
    let commissionIncreasePercent = 0;
    
    if (orderCheck.status === 'awarded') {
      // 客户已选择该承运商，此时释放属于严重违约
      violationType = 'carrier_cancel_after_choice';
      violationDescription = `承运商在客户选择后取消订单 ${orderCheck.tracking_number} (车辆: ${vehicle_id})`;
      penaltyPoints = 20;
      penaltyDurationMinutes = 1440; // 24小时
      commissionIncreasePercent = 5; // 抽成增加5%
    } else if (['pending_claim', 'quoted'].includes(orderCheck.status)) {
      // 客户尚未选择，此时释放属于一般违约
      violationType = 'carrier_cancel_before_choice';
      violationDescription = `承运商在客户选择前取消订单 ${orderCheck.tracking_number} (车辆: ${vehicle_id})`;
      penaltyPoints = 5;
      penaltyDurationMinutes = 30; // 30分钟
      commissionIncreasePercent = 2; // 抽成增加2%
    } else {
      // 订单已在配送过程中，不允许释放
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'ORDER_IN_PROGRESS_CANNOT_RELEASE',
          message: '订单已在配送过程中，无法释放'
        } 
      };
    }

    // 3. 检查是否有其他车辆也认领了此订单（理论上不应该有，因为一个订单只分配给一个车辆）
    const otherVehiclesCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE id = ? AND vehicle_id != ? AND vehicle_id IS NOT NULL
    `, [order_id, vehicle_id]);

    // 4. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    let releaseResult;
    if (otherVehiclesCount.count > 0) {
      // 如果有其他车辆认领（理论上不会发生），只清除当前车辆的分配
      console.log(`🔍 [STEP 4] Other vehicles also assigned to this order, removing only current vehicle's assignment`);
      const updateResult = await db.run(
        `UPDATE orders SET vehicle_id = NULL, updated_at = datetime('now') WHERE id = ? AND vehicle_id = ?`,
        [order_id, vehicle_id]
      );

      if (updateResult.changes === 0) {
        console.log("⚠️ No rows updated during release.");
        await db.run('ROLLBACK');
        return { 
          status: 409, 
          body: { 
            success: false, 
            error: 'RELEASE_FAILED_CONCURRENTLY_MODIFIED',
            message: '订单状态已更改，释放失败'
          } 
        };
      }

      releaseResult = {
        message: '订单已从车辆任务中移除',
        status: 'released_from_vehicle_assignment'
      };
    } else {
      // 如果只有当前车辆认领了此订单，将订单状态重置为 'pending_claim'，这样其他承运商可以认领
      console.log(`🔍 [STEP 4] Only current vehicle assigned to this order, resetting to available state`);
      const updateResult = await db.run(`
        UPDATE orders 
        SET vehicle_id = NULL, carrier_id = NULL, status = 'pending_claim', updated_at = datetime('now') 
        WHERE id = ? AND vehicle_id = ?
      `, [order_id, vehicle_id]);

      if (updateResult.changes === 0) {
        console.log("⚠️ No rows updated during reset.");
        await db.run('ROLLBACK');
        return { 
          status: 409, 
          body: { 
            success: false, 
            error: 'RELEASE_FAILED_CONCURRENTLY_MODIFIED',
            message: '订单状态已更改，释放失败'
          } 
        };
      }

      releaseResult = {
        message: '订单已释放，重新开放给其他承运商认领',
        status: 'reset_to_available'
      };
    }

    // 5. 减少车辆活跃订单计数
    console.log(`🔍 [STEP 5] Decreasing active orders count for vehicle ${vehicle_id}`);
    await db.run(
      `UPDATE tenant_vehicles SET current_active_orders = MAX(0, current_active_orders - 1), updated_at = datetime('now') WHERE id = ?`,
      [vehicle_id]
    );

    // 6. 如果需要，创建违规记录
    if (violationType) {
      console.log(`🔍 [STEP 6] Creating violation record for type: ${violationType}`);
      
      // 获取租户信息
      const tenantInfo = await db.get(`
        SELECT t.id as tenant_id, t.name as tenant_name
        FROM tenants t
        JOIN users u ON u.tenant_id = t.id
        WHERE u.id = ?
      `, [userId]);
      
      // 插入违规记录
      const violationResult = await db.run(`
        INSERT INTO violation_records (
          order_id, violation_type, target_type, target_id, description, 
          penalty_points, status, created_by, created_at, vehicle_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
      `, [
        order_id, 
        violationType, 
        'carrier', 
        tenantInfo.tenant_id, 
        violationDescription,
        penaltyPoints,
        userId, // 创建者
        vehicle_id
      ]);
      
      console.log(`✅ Violation record created for order ${order_id}, type: ${violationType}, violation_id: ${violationResult.lastID}`);
    }

    // 7. 更新车辆处罚状态
    const penaltyExpiryTime = new Date(Date.now() + penaltyDurationMinutes * 60 * 1000).toISOString();
    console.log(`🔍 [STEP 7] Updating vehicle penalty status, expiry: ${penaltyExpiryTime}`);
    await db.run(`
      UPDATE tenant_vehicles 
      SET 
        penalty_points = penalty_points + ?,
        penalty_expiry_time = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [penaltyPoints, penaltyExpiryTime, vehicle_id]);

    // 8. 更新车辆的抽成增加状态（在订单表中记录，实际应用在结算时）
    await db.run(`
      UPDATE tenant_vehicles 
      SET 
        commission_increase_percent = COALESCE(commission_increase_percent, 0) + ?,
        commission_increase_expiry = datetime('now', '+7 days'), -- 抽成增加有效期7天
        updated_at = datetime('now')
      WHERE id = ?
    `, [commissionIncreasePercent, vehicle_id]);

    await db.run('COMMIT');

    console.log(`✅ Order ${order_id} released successfully by vehicle ${vehicle_id}`);
    return { 
      status: 200, 
      body: { 
        success: true, 
        message: releaseResult.message,
        data: { 
          order_id, 
          vehicle_id,
          status: releaseResult.status,
          violation_type: violationType,
          penalty_points_added: penaltyPoints,
          penalty_duration_minutes: penaltyDurationMinutes,
          commission_increase_percent: commissionIncreasePercent,
          penalty_expiry_time: penaltyExpiryTime
        } 
      } 
    };

  } catch (error) {
    console.error('💥 [RELEASE ORDER BY VEHICLE HANDLER ERROR]:', error);
    await db.run('ROLLBACK');
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