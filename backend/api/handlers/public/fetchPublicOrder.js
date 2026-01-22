// api/handlers/public/fetchPublicOrder.js
const { getDb } = require('../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const orderId = c.params.id; // 从路径参数获取订单ID或电话号码

    // 1. 首先尝试按跟踪号查询订单
    let order = await db.get(
      `SELECT * FROM orders WHERE tracking_number = ?`,
      [orderId]
    );

    // 2. 如果没找到，尝试按客户电话查询（支持通过电话号码查询订单）
    if (!order) {
      // 获取该电话号码下的最新订单
      order = await db.get(
        `SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 1`,
        [orderId]
      );
    }

    // 3. 如果还是没找到，返回错误
    if (!order) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }

    // 4. 处理订单数据
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
      order_id: order.tracking_number,
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
      description: order.description || '',
      customer_phone: order.customer_phone
    };

    // 如果订单有报价信息，也一并返回
    if (order.quote_price) {
      orderData.quote = {
        price: order.quote_price,
        delivery_time: order.quote_delivery_time,
        remarks: order.quote_remarks
      };
    }

    // 5. 返回成功
    return {
      statusCode: 200,
      body: {
        success: true,
        data: orderData
      }
    };
  } catch (error) {
    console.error('Error in fetchPublicOrder:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error.message
      }
    };
  }
};