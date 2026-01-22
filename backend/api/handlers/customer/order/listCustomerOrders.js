// api/handlers/customer/order/listCustomerOrders.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.context?.id; // 从认证上下文获取用户ID

    // 📥 获取查询参数（支持分页）
    const page = parseInt(c.request.query.page) || 1;
    const limit = Math.min(parseInt(c.request.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    // 📊 查询当前用户的订单总数
    const totalResult = await db.get(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = ?',
      [userId]
    );
    const total = totalResult?.total || 0;

    // 📋 查询订单列表
    const orders = await db.all(
      `SELECT * FROM orders WHERE customer_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // 处理订单数据
    const processedOrders = orders.map(order => {
      let senderInfo = {}, receiverInfo = {};
      try { 
        senderInfo = typeof order.sender_info === 'string' ? JSON.parse(order.sender_info) : order.sender_info || {};
      } catch (e) { 
        senderInfo = {}; 
      }
      try { 
        receiverInfo = typeof order.receiver_info === 'string' ? JSON.parse(order.receiver_info) : order.receiver_info || {};
      } catch (e) { 
        receiverInfo = {}; 
      }

      // 构建订单对象
      const orderData = {
        id: order.id,
        order_id: order.tracking_number, // 使用跟踪号作为订单ID
        tracking_number: order.tracking_number,
        pickup_address: senderInfo.address || '',
        delivery_address: receiverInfo.address || '',
        weight_kg: order.weight_kg,
        volume_m3: order.volume_m3,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        sender_info: senderInfo,
        receiver_info: receiverInfo,
        description: order.description || ''
      };

      // 如果订单有报价信息，也一并返回
      if (order.quote_price) {
        orderData.quote = {
          price: order.quote_price,
          delivery_time: order.quote_delivery_time,
          remarks: order.quote_remarks
        };
      }

      return orderData;
    });

    // ✅ 返回分页结果
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          orders: processedOrders,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
          },
        },
      },
    };
  } catch (error) {
    console.error('Error in listCustomerOrders:', error);
    return {
      statusCode: 500,
      body: { 
        success: false, 
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch orders',
        details: error.message 
      },
    };
  }
};