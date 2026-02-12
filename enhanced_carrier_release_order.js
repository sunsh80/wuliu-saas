// backend/api/handlers/carrier/order/releaseOrderEnhanced.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 增强版承运商释放订单处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to release order for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const order_id = c.request.params.order_id;
  if (!order_id) {
    console.warn("⚠️ Missing order_id in path parameters");
    return { status: 400, body: { success: false, error: 'MISSING_ORDER_ID' } };
  }

  // 检查角色
  if (!c.context.roles.includes('carrier')) {
    console.log("User does not have 'carrier' role.");
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 1. 检查订单是否存在，是否由该承运商认领
    console.log(`🔍 [STEP 1] Checking order ${order_id} for release eligibility`);
    const orderCheck = await db.get(`
      SELECT id, status, carrier_id, tracking_number 
      FROM orders 
      WHERE id = ? AND carrier_id = ?
    `, [order_id, userId]);

    if (!orderCheck) {
      console.log("❌ Order not found or not assigned to carrier:", order_id);
      return { 
        status: 404, 
        body: { 
          success: false, 
          error: 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED',
          message: '订单不存在或未分配给您'
        } 
      };
    }

    // 2. 根据订单状态判断是否需要创建违规记录
    let violationType = null;
    let violationDescription = '';
    
    if (orderCheck.status === 'awarded') {
      // 客户已选择该承运商，此时释放属于严重违约
      violationType = 'carrier_cancel_after_choice';
      violationDescription = `承运商在客户选择后取消订单 ${orderCheck.tracking_number}`;
    } else if (['pending_claim', 'quoted'].includes(orderCheck.status)) {
      // 客户尚未选择，此时释放属于一般违约
      violationType = 'carrier_cancel_before_choice';
      violationDescription = `承运商在客户选择前取消订单 ${orderCheck.tracking_number}`;
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

    // 3. 检查是否有其他承运商也认领了此订单
    const otherCarriersCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE id = ? AND carrier_id != ? AND carrier_id IS NOT NULL
    `, [order_id, userId]);

    // 4. 根据情况决定如何处理
    let releaseResult;
    if (otherCarriersCount.count > 0) {
      // 如果还有其他承运商认领了此订单，只清除当前承运商的认领关系
      console.log(`🔍 [STEP 4] Other carriers also claimed this order, removing only current carrier's claim`);
      const updateResult = await db.run(
        `UPDATE orders SET carrier_id = NULL, updated_at = datetime('now') WHERE id = ? AND carrier_id = ?`,
        [order_id, userId]
      );

      if (updateResult.changes === 0) {
        console.log("⚠️ No rows updated during release.");
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
        message: '订单已从您的任务中移除，其他承运商仍可处理此订单',
        status: 'released_from_my_claims',
        remaining_carriers: otherCarriersCount.count
      };
    } else {
      // 如果只有当前承运商认领了此订单，将订单状态重置为 'pending_claim'，这样其他承运商可以认领
      console.log(`🔍 [STEP 4] Only current carrier claimed this order, resetting to available state`);
      const updateResult = await db.run(`
        UPDATE orders 
        SET carrier_id = NULL, status = 'pending_claim', updated_at = datetime('now') 
        WHERE id = ? AND carrier_id = ?
      `, [order_id, userId]);

      if (updateResult.changes === 0) {
        console.log("⚠️ No rows updated during reset.");
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

    // 5. 如果需要，创建违规记录
    if (violationType) {
      console.log(`🔍 [STEP 5] Creating violation record for type: ${violationType}`);
      
      // 获取租户信息
      const tenantInfo = await db.get('SELECT id, name FROM tenants WHERE id = (SELECT tenant_id FROM users WHERE id = ?)', [userId]);
      
      // 插入违规记录
      await db.run(`
        INSERT INTO violation_records (
          order_id, violation_type, target_type, target_id, description, 
          penalty_points, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
      `, [
        order_id, 
        violationType, 
        'carrier', 
        tenantInfo.id, 
        violationDescription,
        violationType === 'carrier_cancel_after_choice' ? 20 : 5, // 根据违规类型设置处罚积分
        userId // 创建者是系统或管理员
      ]);
      
      console.log(`✅ Violation record created for order ${order_id}, type: ${violationType}`);
    }

    console.log(`✅ Order ${order_id} released successfully by carrier ${userId}`);
    return { 
      status: 200, 
      body: { 
        success: true, 
        message: releaseResult.message,
        data: { 
          order_id, 
          status: releaseResult.status,
          ...(releaseResult.remaining_carriers !== undefined && {remaining_carriers: releaseResult.remaining_carriers})
        } 
      } 
    };

  } catch (error) {
    console.error('💥 [ENHANCED RELEASE ORDER HANDLER ERROR]:', error);
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