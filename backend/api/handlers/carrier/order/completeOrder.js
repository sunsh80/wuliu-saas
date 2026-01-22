// backend/api/handlers/carrier/order/completeOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  
  console.log(`[completeOrder] Completing order ${order_id} by carrier ${c.context.id}`);
  
  if (!order_id) {
    console.log('[completeOrder] Missing order ID');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_ORDER_ID',
        message: 'Order ID is required'
      }
    };
  }

  const db = getDb();
  
  try {
    // 检查订单是否由当前承运商负责
    const order = await db.get(
      `SELECT id, status, carrier_id FROM orders WHERE id = ?`,
      [order_id]
    );
    
    if (!order) {
      console.log(`[completeOrder] Order not found: ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }
    
    // 验证订单是否由当前承运商负责
    if (order.carrier_id != c.context.id) {
      console.log(`[completeOrder] Order ${order_id} is not assigned to current carrier`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: 'This order is not assigned to you'
        }
      };
    }
    
    // 验证订单当前状态是否允许完成
    if (!['awarded', 'in_transit'].includes(order.status)) {
      console.log(`[completeOrder] Order ${order_id} is not in a state that allows completion: ${order.status}`);
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATE',
          message: 'Order is not in a state that allows completion'
        }
      };
    }
    
    // 更新订单状态为已完成
    const result = await db.run(
      `UPDATE orders 
       SET status = 'delivered', completed_at = datetime('now'), updated_at = datetime('now') 
       WHERE id = ?`,
      [order_id]
    );
    
    if (result.changes === 0) {
      console.log(`[completeOrder] Failed to update order ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_UPDATE_FAILED',
          message: 'Failed to update order'
        }
      };
    }
    
    console.log(`[completeOrder] Order ${order_id} successfully marked as delivered`);
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Order successfully completed',
        data: {
          order_id: order_id,
          status: 'delivered'
        }
      }
    };
    
  } catch (error) {
    console.error('[completeOrder] Database error:', error);
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