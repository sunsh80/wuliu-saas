// backend/api/handlers/carrier/order/releaseOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商释放订单处理器启动 ---");
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
    // 1. 检查订单是否存在，是否由该承运商认领，且状态是否允许释放
    console.log(`🔍 [STEP 1] Checking order ${order_id} for release eligibility`);
    const orderCheck = await db.get(`
      SELECT id, status, carrier_id 
      FROM orders 
      WHERE id = ? AND carrier_id = ? AND status IN ('pending_claim', 'quoted')
    `, [order_id, userId]);

    if (!orderCheck) {
      console.log("❌ Order not found, not assigned to carrier, or status doesn't allow release:", order_id);
      return { 
        status: 404, 
        body: { 
          success: false, 
          error: 'ORDER_NOT_FOUND_OR_NOT_ELIGIBLE_FOR_RELEASE',
          message: '订单不存在、未分配给您或状态不允许释放'
        } 
      };
    }

    // 2. 检查是否有其他承运商也认领了此订单
    const otherCarriersCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE id = ? AND carrier_id != ? AND carrier_id IS NOT NULL
    `, [order_id, userId]);

    // 3. 根据情况决定如何处理
    if (otherCarriersCount.count > 0) {
      // 如果还有其他承运商认领了此订单，只清除当前承运商的认领关系
      console.log(`🔍 [STEP 3] Other carriers also claimed this order, removing only current carrier's claim`);
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

      console.log(`✅ Order ${order_id} released from carrier ${userId}, other carriers still claimed`);
      return { 
        status: 200, 
        body: { 
          success: true, 
          message: '订单已从您的任务中移除，其他承运商仍可处理此订单',
          data: { 
            order_id, 
            status: 'released_from_my_claims',
            remaining_carriers: otherCarriersCount.count
          } 
        } 
      };
    } else {
      // 如果只有当前承运商认领了此订单，将订单状态重置为 'created'，这样其他承运商可以认领
      console.log(`🔍 [STEP 3] Only current carrier claimed this order, resetting to available state`);
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

      console.log(`✅ Order ${order_id} reset to available state after carrier ${userId} released it`);
      return { 
        status: 200, 
        body: { 
          success: true, 
          message: '订单已释放，重新开放给其他承运商认领',
          data: { 
            order_id, 
            status: 'reset_to_available'
          } 
        } 
      };
    }

  } catch (error) {
    console.error('💥 [RELEASE ORDER HANDLER ERROR]:', error);
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