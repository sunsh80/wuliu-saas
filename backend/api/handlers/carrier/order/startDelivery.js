// backend/api/handlers/carrier/order\startDelivery.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  
  console.log(`[startDelivery] Starting delivery for order ${order_id} by carrier ${c.context.id}`);
  
  if (!order_id) {
    console.log('[startDelivery] Missing order ID');
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
      console.log(`[startDelivery] Order not found: ${order_id}`);
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
      console.log(`[startDelivery] Order ${order_id} is not assigned to current carrier`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: 'This order is not assigned to you'
        }
      };
    }
    
    // 验证订单当前状态是否允许开始运输
    if (order.status !== 'awarded') {
      console.log(`[startDelivery] Order ${order_id} is not in awarded state: ${order.status}`);
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATE',
          message: 'Order must be in awarded state to start delivery'
        }
      };
    }
    
    // 更新订单状态为运输中
    const result = await db.run(
      `UPDATE orders 
       SET status = 'in_transit', updated_at = datetime('now') 
       WHERE id = ?`,
      [order_id]
    );
    
    if (result.changes === 0) {
      console.log(`[startDelivery] Failed to update order ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_UPDATE_FAILED',
          message: 'Failed to update order'
        }
      };
    }
    
    console.log(`[startDelivery] Order ${order_id} successfully marked as in transit`);
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Delivery started successfully',
        data: {
          order_id: order_id,
          status: 'in_transit'
        }
      }
    };
    
  } catch (error) {
    console.error('[startDelivery] Database error:', error);
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