// backend/api/handlers/carrier/order/claimCarrierOrderEnhanced.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 增强版承运商认领订单处理器启动 ---");
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

  const db = getDb();

  try {
    // 1. 检查订单是否存在且状态为 'pending_claim'
    console.log(`🔍 [STEP 1] Checking order ${order_id} for status 'pending_claim'`);
    const orderCheck = await db.get(
      `SELECT id, status FROM orders WHERE id = ? AND status = 'pending_claim'`,
      [order_id]
    );

    if (!orderCheck) {
      console.log("❌ Order not found or not in 'pending_claim' status:", order_id);
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_PENDING_CLAIM' } };
    }

    // 2. 检查承运商当前正在处理的订单数量（可配置的最大并发订单数）
    console.log(`🔍 [STEP 2] Checking current active orders for carrier ${userId}`);
    const maxActiveOrders = c.context.max_active_orders || 3; // 默认最多3个活跃订单，可从配置或用户表获取
    
    // 查询承运商当前状态为 'pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit' 的订单数量
    const activeOrdersCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE carrier_id = ? 
      AND status IN ('pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit')
    `, [userId]);
    
    console.log(`🔍 [STEP 2] Current active orders count: ${activeOrdersCount.count}, Max allowed: ${maxActiveOrders}`);
    
    if (activeOrdersCount.count >= maxActiveOrders) {
      console.log(`❌ Carrier ${userId} has reached maximum active orders limit (${maxActiveOrders})`);
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'MAX_ACTIVE_ORDERS_LIMIT_REACHED',
          message: `您当前正在处理 ${activeOrdersCount.count} 个订单，已达上限 ${maxActiveOrders} 个。请先完成现有订单再认领新订单。`
        } 
      };
    }

    // 3. 检查该承运商是否已经认领了这个订单
    console.log(`🔍 [STEP 3] Checking if carrier ${userId} already claimed order ${order_id}`);
    const alreadyClaimed = await db.get(
      `SELECT id FROM orders WHERE id = ? AND carrier_id = ?`,
      [order_id, userId]
    );
    
    if (alreadyClaimed) {
      console.log(`⚠️ Carrier ${userId} has already claimed order ${order_id}`);
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'ORDER_ALREADY_CLAIMED_BY_THIS_CARRIER',
          message: '您已经认领了此订单'
        } 
      };
    }

    // 4. 更新订单的 carrier_id，但保持 'pending_claim' 状态以允许多个承运商报价
    console.log(`🔍 [STEP 4] Setting carrier ${userId} for order ${order_id} while keeping status 'pending_claim'`);
    const updateResult = await db.run(
      `UPDATE orders SET carrier_id = ?, updated_at = datetime('now') WHERE id = ? AND status = 'pending_claim'`,
      [userId, order_id]
    );

    console.log("✅ Update attempt completed. Rows changed:", updateResult.changes);

    if (updateResult.changes === 0) {
       console.log("⚠️ No rows updated. Order was likely claimed by another carrier just before this request.");
       return { status: 409, body: { success: false, error: 'CLAIM_FAILED_CONCURRENTLY_MODIFIED' } };
    }

    console.log("🎉 Order claimed successfully!");
    return { 
      status: 200, 
      body: { 
        success: true, 
        message: '订单认领成功', 
        data: { 
          order_id, 
          carrierId: userId, 
          status: 'pending_claim',
          activeOrdersCount: activeOrdersCount.count + 1,
          maxAllowed: maxActiveOrders
        } 
      } 
    };

  } catch (error) {
    console.error('💥 [ENHANCED HANDLER ERROR]:', error);
    if (error.code === 'SQLITE_BUSY' || error.message.includes('database is locked') || error.message.includes('locked')) {
         return { status: 423, body: { success: false, error: 'DATABASE_LOCKED', message: '数据库当前繁忙。请稍后再试。' } };
    }
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' } };
  }
};