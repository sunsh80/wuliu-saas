// backend/api/handlers/carrier/order/assignVehicleToOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商为订单分配车辆处理器启动 ---");
  const userId = c.context?.id;
  const order_id = c.request.params.order_id;
  const { vehicle_id } = c.request.body;

  // 验证权限和参数
  if (!userId || !order_id || !vehicle_id) {
    return { status: 400, body: { success: false, error: 'MISSING_PARAMETERS' } };
  }

  if (!c.context.roles.includes('carrier')) {
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 檢查订单状态和车辆归属
    const order = await db.get(
      `SELECT id, status FROM orders WHERE id = ? AND status = 'pending_claim'`,
      [order_id]
    );
    
    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_PENDING_CLAIM' } };
    }

    const vehicle = await db.get(
      `SELECT v.*, t.id as tenant_id FROM tenant_vehicles v JOIN users u ON v.tenant_id = u.tenant_id WHERE v.id = ? AND u.id = ?`,
      [vehicle_id, userId]
    );
    
    if (!vehicle) {
      return { status: 403, body: { success: false, error: 'VEHICLE_NOT_OWNED_BY_CARRIER' } };
    }

    // 檢查车辆当前活跃订单数
    const activeOrdersCount = await db.get(
      `SELECT COUNT(*) as count FROM order_assignments WHERE vehicle_id = ? AND status IN ('assigned', 'quoted')`,
      [vehicle_id]
    );
    
    if (activeOrdersCount.count >= vehicle.max_active_orders) {
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'VEHICLE_MAX_ACTIVE_ORDERS_LIMIT_REACHED',
          message: `车辆当前正在处理 ${activeOrdersCount.count} 个订单，已达上限 ${vehicle.max_active_orders} 个`
        } 
      };
    }

    // 檢查是否已分配
    const existingAssignment = await db.get(
      `SELECT id FROM order_assignments WHERE order_id = ? AND vehicle_id = ?`,
      [order_id, vehicle_id]
    );
    
    if (existingAssignment) {
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'ORDER_ALREADY_ASSIGNED_TO_VEHICLE',
          message: '订单已分配给该车辆'
        } 
      };
    }

    // 檢查是否已经有其他车辆分配了此订单
    const otherAssignments = await db.get(
      `SELECT id FROM order_assignments WHERE order_id = ? AND carrier_id = ? AND status IN ('assigned', 'quoted')`,
      [order_id, userId]
    );
    
    if (otherAssignments) {
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'ORDER_ALREADY_ASSIGNED_TO_ANOTHER_VEHICLE',
          message: '订单已分配给该承运商的其他车辆'
        } 
      };
    }

    // 分配订单给车辆
    await db.run(
      `INSERT INTO order_assignments (order_id, carrier_id, vehicle_id, status) VALUES (?, ?, ?, 'assigned')`,
      [order_id, userId, vehicle_id]
    );

    // 增加车辆活跃订单计数
    await db.run(
      `UPDATE tenant_vehicles SET current_active_orders = current_active_orders + 1 WHERE id = ?`,
      [vehicle_id]
    );

    // 返回分配信息
    const assignment = await db.get(
      `SELECT * FROM order_assignments WHERE order_id = ? AND vehicle_id = ?`,
      [order_id, vehicle_id]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: '订单分配成功',
        data: { assignment }
      }
    };

  } catch (error) {
    console.error('Assign vehicle to order error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};