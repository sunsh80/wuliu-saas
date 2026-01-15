// backend/api/handlers/public/fetchPublicOrder.js
const { getDb } = require('../../../db/index.js');

module.exports = async (c /*, req, res */) => {
  const { id } = c.request.params; // 获取 URL 参数中的 tracking_number

  if (!id) {
    return {
      statusCode: 400,
      body: { success: false, error: 'TRACKING_NUMBER_REQUIRED' }
    };
  }

  try {
    const db = getDb();

    // 查询订单
    const order = await db.get(`
      SELECT 
        order_id, 
        tracking_number, 
        sender_info, 
        receiver_info, 
        status, 
        completed_at, 
        created_at
      FROM orders 
      WHERE tracking_number = ?
    `, [id]);

    if (!order) {
      return {
        statusCode: 404,
        body: { success: false, error: 'ORDER_NOT_FOUND' }
      };
    }

    // 解析 JSON 字段
    const senderInfo = JSON.parse(order.sender_info);
    const receiverInfo = JSON.parse(order.receiver_info);

    return {
      statusCode: 200,
      body: {
        success: true,
        order: {
          id: order.order_id,
          tracking_number: order.tracking_number,
          sender_info: senderInfo,
          receiver_info: receiverInfo,
          status: order.status,
          completed_at: order.completed_at,
          created_at: order.created_at
        }
      }
    };
  } catch (error) {
    console.error('[fetchPublicOrder] 内部错误:', error.message);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_SERVER_ERROR' }
    };
  }
};