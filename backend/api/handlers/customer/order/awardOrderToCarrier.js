// backend/api/handlers/customer/order/awardOrderToCarrier.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  const { carrier_tenant_id } = c.request.body;
  
  console.log(`[awardOrderToCarrier] Awarding order ${order_id} to carrier tenant ${carrier_tenant_id}`);
  
  // 验证参数
  if (!order_id || !carrier_tenant_id) {
    console.log('[awardOrderToCarrier] Missing required parameters');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Order ID and carrier tenant ID are required'
      }
    };
  }

  const db = getDb();
  
  try {
    // 首先检查订单是否属于当前客户
    const order = await db.get(
      `SELECT id, tenant_id, status, carrier_id FROM orders WHERE id = ?`,
      [order_id]
    );
    
    if (!order) {
      console.log(`[awardOrderToCarrier] Order not found: ${order_id}`);
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
      console.log(`[awardOrderToCarrier] Order ${order_id} does not belong to current customer`);
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
      console.log(`[awardOrderToCarrier] Order ${order_id} is not in a state that allows awarding: ${order.status}`);
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATE',
          message: 'Order is not in a state that allows awarding to a carrier'
        }
      };
    }
    
    // 获取承运商的用户ID（因为订单表中的 carrier_id 字段存储的是用户ID）
    const carrierUser = await db.get(
      `SELECT id FROM users WHERE tenant_id = ? AND user_type = 'tenant_user'`,
      [carrier_tenant_id]
    );
    
    if (!carrierUser) {
      console.log(`[awardOrderToCarrier] Carrier tenant not found: ${carrier_tenant_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'CARRIER_NOT_FOUND',
          message: 'Carrier tenant not found'
        }
      };
    }
    
    // 更新订单状态为 awarded，并设置承运商ID
    const result = await db.run(
      `UPDATE orders 
       SET status = 'awarded', carrier_id = ?, updated_at = datetime('now') 
       WHERE id = ?`,
      [carrierUser.id, order_id]
    );
    
    if (result.changes === 0) {
      console.log(`[awardOrderToCarrier] Failed to update order ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_UPDATE_FAILED',
          message: 'Failed to update order'
        }
      };
    }
    
    console.log(`[awardOrderToCarrier] Order ${order_id} successfully awarded to carrier ${carrierUser.id}`);
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Order successfully awarded to carrier',
        data: {
          order_id: order_id,
          carrier_tenant_id: carrier_tenant_id,
          status: 'awarded'
        }
      }
    };
    
  } catch (error) {
    console.error('[awardOrderToCarrier] Database error:', error);
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