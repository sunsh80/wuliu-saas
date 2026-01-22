// backend/api/handlers/customer/order/getOrderQuotes.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { orderId } = c.request.params;
  
  console.log(`[getOrderQuotes] Fetching quotes for order ${orderId}`);
  
  if (!orderId) {
    console.log('[getOrderQuotes] Missing order ID');
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
    // 首先检查订单是否属于当前客户
    const order = await db.get(
      `SELECT id, tenant_id, status FROM orders WHERE id = ?`,
      [orderId]
    );
    
    if (!order) {
      console.log(`[getOrderQuotes] Order not found: ${orderId}`);
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
      console.log(`[getOrderQuotes] Order ${orderId} does not belong to current customer`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: 'This order does not belong to you'
        }
      };
    }
    
    // 获取订单的所有报价信息
    // 从订单表中获取报价信息（因为没有单独的 quotes 表）
    const orderWithQuote = await db.get(
      `SELECT 
         quote_price, 
         quote_delivery_time, 
         quote_remarks,
         carrier_id,
         status
       FROM orders 
       WHERE id = ?`,
      [orderId]
    );
    
    if (!orderWithQuote || !orderWithQuote.quote_price) {
      console.log(`[getOrderQuotes] No quotes found for order: ${orderId}`);
      return {
        status: 200,
        body: {
          success: true,
          data: {
            order_id: orderId,
            quotes: []
          }
        }
      };
    }
    
    // 获取承运商信息
    let carrierInfo = null;
    if (orderWithQuote.carrier_id) {
      const carrierUser = await db.get(
        `SELECT u.name as carrier_name, t.name as tenant_name 
         FROM users u 
         LEFT JOIN tenants t ON u.tenant_id = t.id 
         WHERE u.id = ?`,
        [orderWithQuote.carrier_id]
      );
      
      if (carrierUser) {
        carrierInfo = {
          id: orderWithQuote.carrier_id,
          name: carrierUser.carrier_name || carrierUser.tenant_name,
          tenant_name: carrierUser.tenant_name
        };
      }
    }
    
    const quotes = [{
      carrier: carrierInfo,
      price: orderWithQuote.quote_price,
      delivery_time: orderWithQuote.quote_delivery_time,
      remarks: orderWithQuote.quote_remarks,
      status: orderWithQuote.status,
      created_at: order.created_at // 使用订单的创建时间作为报价时间
    }];
    
    console.log(`[getOrderQuotes] Found ${quotes.length} quotes for order ${orderId}`);
    
    return {
      status: 200,
      body: {
        success: true,
        data: {
          order_id: orderId,
          quotes: quotes
        }
      }
    };
    
  } catch (error) {
    console.error('[getOrderQuotes] Database error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching quotes'
      }
    };
  }
};