// backend/api/handlers/carrier/order/listCarrierOrders.js

const getDb = require('../../../../db');

/** 
 * 承运商获取可报价的订单列表
 */
module.exports = async (c) => {
  // 🔴 关键日志 1：确认函数被调用
  console.log('🔍 [listCarrierOrders] Handler function called');
  console.log('   → Context roles:', c.context?.roles);
  console.log('   → Context tenantId:', c.context?.tenantId);

  // 1. 权限校验
  if (!c.context.roles || !c.context.roles.includes('carrier')) {
    console.warn('⚠️ [listCarrierOrders] Access denied: not a carrier');
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'NOT_A_CARRIER',
        message: 'Only carrier tenants can access this endpoint.'
      }
    };
  }

  const db = getDb();
  try {
    // 🔴 关键日志 2：即将执行查询
    console.log('🔍 [listCarrierOrders] Executing SQL query...');

    const orders = await db.all(`
      SELECT 
        id AS order_id,
        tracking_number AS tracking_code,
        sender_info,
        receiver_info,
        status,
        customer_phone,
        created_at
      FROM orders
      WHERE status IN ('pending_claim', 'quoted')
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // 🔴 关键日志 3：查询完成
    console.log('✅ [listCarrierOrders] Query completed. Found', orders.length, 'orders');

    // 3. 格式化
    const formattedOrders = orders.map(order => {
      let sender = {}, receiver = {};
      try { sender = order.sender_info ? JSON.parse(order.sender_info) : {}; } catch (e) {}
      try { receiver = order.receiver_info ? JSON.parse(order.receiver_info) : {}; } catch (e) {}

      return {
        id: order.order_id,
        tracking_number: order.tracking_code,
        sender_info: sender,
        receiver_info: receiver,
        status: order.status,
        customer_phone: order.customer_phone,
        created_at: order.created_at
      };
    });

    // 🔴 关键日志 4：准备返回
    console.log('📤 [listCarrierOrders] Returning response with', formattedOrders.length, 'orders');

    return {
      statusCode: 200,
      body: {
        success: true,
        data: { orders: formattedOrders }
      }
    };

  } catch (error) {
    console.error('❌ [listCarrierOrders] Database error:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch orders.'
      }
    };
  }
};