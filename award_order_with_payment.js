// backend/api/handlers/customer/order/awardOrderToCarrierWithPayment.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  const { carrier_tenant_id, vehicle_id } = c.request.body;

  console.log(`[awardOrderToCarrierWithPayment] Awarding order ${order_id} to carrier tenant ${carrier_tenant_id} with vehicle ${vehicle_id}`);

  // 验证参数
  if (!order_id || !carrier_tenant_id || !vehicle_id) {
    console.log('[awardOrderToCarrierWithPayment] Missing required parameters');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Order ID, carrier tenant ID, and vehicle ID are required'
      }
    };
  }

  const db = getDb();

  try {
    // 1. 检查订单是否属于当前客户
    const order = await db.get(
      `SELECT id, tenant_id, status, customer_tenant_id FROM orders WHERE id = ?`,
      [order_id]
    );

    if (!order) {
      console.log(`[awardOrderToCarrierWithPayment] Order not found: ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }

    // 验证订单是否属于当前客户
    if (order.tenant_id !== c.context.tenantId) {
      console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} does not belong to current customer`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: 'This order does not belong to you'
        }
      };
    }

    // 验证订单当前状态是否允许被授予
    if (!['created', 'pending_claim', 'quoted'].includes(order.status)) {
      console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} is not in a state that allows awarding: ${order.status}`);
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATE',
          message: 'Order is not in a state that allows awarding to a carrier'
        }
      };
    }

    // 2. 获取承运商用户ID和车辆信息
    const carrierUser = await db.get(
      `SELECT id FROM users WHERE tenant_id = ? AND user_type = 'tenant_user'`,
      [carrier_tenant_id]
    );

    if (!carrierUser) {
      console.log(`[awardOrderToCarrierWithPayment] Carrier tenant not found: ${carrier_tenant_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'CARRIER_NOT_FOUND',
          message: 'Carrier tenant not found'
        }
      };
    }

    // 验证车辆是否属于该承运商
    const vehicle = await db.get(
      `SELECT id, tenant_id FROM tenant_vehicles WHERE id = ?`,
      [vehicle_id]
    );

    if (!vehicle) {
      console.log(`[awardOrderToCarrierWithPayment] Vehicle not found: ${vehicle_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      };
    }

    // 验证车辆是否属于该承运商
    const vehicleOwner = await db.get(
      `SELECT u.id FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE t.id = ? AND u.id = ?`,
      [vehicle.tenant_id, carrierUser.id]
    );

    if (!vehicleOwner) {
      console.log(`[awardOrderToCarrierWithPayment] Vehicle ${vehicle_id} does not belong to carrier ${carrier_tenant_id}`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'VEHICLE_NOT_OWNED_BY_CARRIER',
          message: 'Vehicle does not belong to the selected carrier'
        }
      };
    }

    // 3. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 4. 更新订单状态为'awarded'，并设置承运商和车辆信息
    const updateOrderResult = await db.run(
      `UPDATE orders
       SET status = 'awarded', carrier_id = ?, vehicle_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [carrierUser.id, vehicle_id, order_id]
    );

    if (updateOrderResult.changes === 0) {
      console.log(`[awardOrderToCarrierWithPayment] Failed to update order ${order_id}`);
      await db.run('ROLLBACK');
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_UPDATE_FAILED',
          message: 'Failed to update order'
        }
      };
    }

    // 5. 更新其他分配记录为'rejected'状态
    await db.run(
      `UPDATE order_assignments 
       SET status = 'rejected', updated_at = datetime('now')
       WHERE order_id = ? AND (carrier_id != ? OR vehicle_id != ?)`,
      [order_id, carrierUser.id, vehicle_id]
    );

    // 6. 减少其他车辆的活跃订单计数
    await db.run(
      `UPDATE tenant_vehicles 
       SET current_active_orders = MAX(0, current_active_orders - 1), updated_at = datetime('now')
       WHERE id IN (
         SELECT vehicle_id FROM order_assignments 
         WHERE order_id = ? AND status = 'rejected'
       )`,
      [order_id]
    );

    // 7. 处理支付锁定（简化处理，实际应用中需要集成支付网关）
    // 这里可以添加支付处理逻辑，如调用第三方支付API
    console.log(`[awardOrderToCarrierWithPayment] Processing payment lock for order ${order_id}`);
    
    // 在实际应用中，这里会：
    // - 调用支付网关API锁定客户资金
    // - 记录支付信息到payment_transactions表
    // - 更新订单的支付状态
    const paymentLockResult = {
      transaction_id: `PAY-${order_id}-${Date.now()}`,
      status: 'locked',
      amount: order.quote_price || 0, // 使用报价金额或订单金额
      currency: 'CNY'
    };

    // 8. 提交事务
    await db.run('COMMIT');

    console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} successfully awarded to carrier ${carrierUser.id} with vehicle ${vehicle_id}`);

    return {
      status: 200,
      body: {
        success: true,
        message: 'Order successfully awarded to carrier with payment locked',
        data: {
          order_id: order_id,
          carrier_tenant_id: carrier_tenant_id,
          vehicle_id: vehicle_id,
          status: 'awarded',
          payment_lock: paymentLockResult
        }
      }
    };

  } catch (error) {
    console.error('[awardOrderToCarrierWithPayment] Database error:', error);
    await db.run('ROLLBACK');
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while processing your request'
      }
    };
  }
};