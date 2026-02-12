// backend/api/handlers/carrier/order/claimOrderWithVehicle.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商使用指定车辆认领订单处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to claim order with vehicle for user ID:", userId);

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
    // 1. 检查订单是否存在且状态为 'pending_claim'
    console.log(`🔍 [STEP 1] Checking order ${order_id} for status 'pending_claim'`);
    const orderCheck = await db.get(
      `SELECT id, status, customer_tenant_id FROM orders WHERE id = ? AND status = 'pending_claim'`,
      [order_id]
    );

    if (!orderCheck) {
      console.log("❌ Order not found or not in 'pending_claim' status:", order_id);
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_PENDING_CLAIM' } };
    }

    // 2. 检查车辆是否属于当前承运商
    console.log(`🔍 [STEP 2] Checking if vehicle ${vehicle_id} belongs to carrier ${userId}`);
    const vehicleCheck = await db.get(`
      SELECT v.*, t.id as tenant_id
      FROM tenant_vehicles v
      JOIN users u ON v.tenant_id = u.tenant_id
      JOIN tenants t ON u.tenant_id = t.id
      WHERE v.id = ? AND u.id = ?
    `, [vehicle_id, userId]);

    if (!vehicleCheck) {
      console.log(`❌ Vehicle ${vehicle_id} does not belong to carrier ${userId}`);
      return { 
        status: 403, 
        body: { 
          success: false, 
          error: 'VEHICLE_NOT_OWNED_BY_CARRIER',
          message: '车辆不属于当前承运商'
        } 
      };
    }

    // 3. 检查车辆当前活跃订单数量
    console.log(`🔍 [STEP 3] Checking current active orders for vehicle ${vehicle_id}`);
    const maxActiveOrders = vehicleCheck.max_active_orders || 3; // 默认最多3个活跃订单
    
    // 查询车辆当前状态为 'pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit' 的订单数量
    const activeOrdersCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE vehicle_id = ? 
      AND status IN ('pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit')
    `, [vehicle_id]);
    
    console.log(`🔍 [STEP 3] Vehicle ${vehicle_id} current active orders count: ${activeOrdersCount.count}, Max allowed: ${maxActiveOrders}`);
    
    if (activeOrdersCount.count >= maxActiveOrders) {
      console.log(`❌ Vehicle ${vehicle_id} has reached maximum active orders limit (${maxActiveOrders})`);
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'VEHICLE_MAX_ACTIVE_ORDERS_LIMIT_REACHED',
          message: `车辆当前正在处理 ${activeOrdersCount.count} 个订单，已达上限 ${maxActiveOrders} 个。请先完成现有订单再认领新订单。`
        } 
      };
    }

    // 4. 检查车辆是否处于处罚期
    if (vehicleCheck.penalty_expiry_time) {
      const now = new Date();
      const penaltyExpiry = new Date(vehicleCheck.penalty_expiry_time);
      if (now < penaltyExpiry) {
        const remainingMinutes = Math.ceil((penaltyExpiry - now) / (1000 * 60));
        console.log(`❌ Vehicle ${vehicle_id} is under penalty until ${vehicleCheck.penalty_expiry_time}`);
        return { 
          status: 409, 
          body: { 
            success: false, 
            error: 'VEHICLE_UNDER_PENALTY',
            message: `车辆处于处罚期，还需等待 ${remainingMinutes} 分钟`
          } 
        };
      }
    }

    // 5. 检查该车辆是否已经认领了这个订单
    console.log(`🔍 [STEP 5] Checking if vehicle ${vehicle_id} already claimed order ${order_id}`);
    const alreadyClaimed = await db.get(
      `SELECT id FROM orders WHERE id = ? AND vehicle_id = ?`,
      [order_id, vehicle_id]
    );
    
    if (alreadyClaimed) {
      console.log(`⚠️ Vehicle ${vehicle_id} has already claimed order ${order_id}`);
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'ORDER_ALREADY_CLAIMED_BY_THIS_VEHICLE',
          message: '车辆已经认领了此订单'
        } 
      };
    }

    // 6. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 7. 更新订单的 vehicle_id 和 carrier_id，但保持 'pending_claim' 状态以允许多个承运商报价
    console.log(`🔍 [STEP 7] Setting vehicle ${vehicle_id} and carrier ${userId} for order ${order_id}`);
    const updateResult = await db.run(
      `UPDATE orders SET vehicle_id = ?, carrier_id = ?, updated_at = datetime('now') WHERE id = ? AND status = 'pending_claim'`,
      [vehicle_id, userId, order_id]
    );

    if (updateResult.changes === 0) {
       console.log("⚠️ No rows updated. Order was likely claimed by another carrier just before this request.");
       await db.run('ROLLBACK');
       return { status: 409, body: { success: false, error: 'CLAIM_FAILED_CONCURRENTLY_MODIFIED' } };
    }

    // 8. 增加车辆活跃订单计数
    console.log(`🔍 [STEP 8] Increasing active orders count for vehicle ${vehicle_id}`);
    await db.run(
      `UPDATE tenant_vehicles SET current_active_orders = current_active_orders + 1, updated_at = datetime('now') WHERE id = ?`,
      [vehicle_id]
    );

    await db.run('COMMIT');

    console.log("🎉 Order claimed successfully with vehicle!");
    
    // 查询更新后的车辆信息
    const updatedVehicle = await db.get(
      `SELECT id, plate_number, current_active_orders, max_active_orders FROM tenant_vehicles WHERE id = ?`,
      [vehicle_id]
    );

    return { 
      status: 200, 
      body: { 
        success: true, 
        message: '订单认领成功', 
        data: { 
          order_id, 
          vehicle_id,
          carrierId: userId, 
          status: 'pending_claim',
          vehicle_info: {
            plate_number: updatedVehicle.plate_number,
            current_active_orders: updatedVehicle.current_active_orders,
            max_allowed: updatedVehicle.max_active_orders
          }
        } 
      } 
    };

  } catch (error) {
    console.error('💥 [CLAIM ORDER WITH VEHICLE HANDLER ERROR]:', error);
    await db.run('ROLLBACK');
    if (error.code === 'SQLITE_BUSY' || error.message.includes('database is locked') || error.message.includes('locked')) {
         return { status: 423, body: { success: false, error: 'DATABASE_LOCKED', message: '数据库当前繁忙。请稍后再试。' } };
    }
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' } };
  }
};