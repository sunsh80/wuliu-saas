// backend/api/handlers/carrier/order/claimCarrierOrder.js
const { getDb } = require('../../../../db/index.js');
const { requireAuth } = require('../../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  console.log("--- Claim Order Handler Start (Simple Status Check) ---");
  const userId = c.context?.id;
  console.log("Received request to claim order for user ID:", userId);

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

  const db = getDb(); // 获取经过 db/index.js 封装的 db 实例

  try {
    // 1. 检查订单是否存在且状态为 'pending_claim'
    console.log(`🔍 [STEP 1] Checking order ${order_id} for status 'pending_claim'`);
    const orderCheck = await db.get(
      `SELECT id, status FROM orders WHERE id = ? AND status = 'pending_claim'`,
      [order_id]
    );

    if (!orderCheck) {
      // 订单不存在，或状态不是 'pending_claim'
      console.log("❌ Order not found or not in 'pending_claim' status:", order_id);
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_PENDING_CLAIM' } };
    }

    // 2. 更新订单的 carrier_id，但保持 'pending_claim' 状态以允许多个承运商报价
    // 使用 UPDATE WHERE 条件来保证原子性，防止并发冲突
    console.log(`🔍 [STEP 2] Setting carrier ${userId} for order ${order_id} while keeping status 'pending_claim' to allow multiple carriers to quote`);
    const updateResult = await db.run(
      `UPDATE orders SET carrier_id = ?, updated_at = datetime('now') WHERE id = ? AND status = 'pending_claim'`,
      [userId, order_id]
    );

    console.log("✅ Update attempt completed. Rows changed:", updateResult.changes);

    // 检查是否有行被更新（这是防止并发认领冲突的唯一关键检查点）
    // 如果 updateResult.changes 为 0，说明在查询和更新之间，另一个请求已经把 status 改掉了
    if (updateResult.changes === 0) {
       console.log("⚠️ No rows updated. Order was likely claimed by another carrier just before this request.");
       return { status: 409, body: { success: false, error: 'CLAIM_FAILED_CONCURRENTLY_MODIFIED' } };
    }

    console.log("🎉 Order claimed successfully!");
    return { status: 200, body: { success: true, message: 'Order claimed successfully', data: { order_id, carrierId: userId, status: 'claimed' } } };

  } catch (error) {
    console.error('💥 [HANDLER ERROR (Simple Status Check)]:', error);
    if (error.code === 'SQLITE_BUSY' || error.message.includes('database is locked') || error.message.includes('locked')) {
         return { status: 423, body: { success: false, error: 'DATABASE_LOCKED', message: 'The database is currently locked. Please try again later.' } };
    }
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? error.message : undefined } };
  }
});