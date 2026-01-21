// api/handlers/customer/order/getCustomerOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c, req, res) => {
  try {
    const db = getDb();
    const userId = c.context?.id; // 👈 来自 session

    const orderId = c.request.params?.id;

    // 📥 验证订单 ID
    if (!orderId || typeof orderId !== 'string') {
      return { statusCode: 400, body: { success: false, error: 'Invalid order ID' } };
    }

    // 🔍 获取当前用户所属组织
    const user = await db.get('SELECT organization_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }
    const { organization_id } = user;

    // 🔐 查询订单（必须属于当前组织）
    const order = await db.get(
      `SELECT id, tracking_number, sender_info, receiver_info, status, customer_id, created_at, updated_at
       FROM orders WHERE id = ? AND organization_id = ?`,
      [orderId, organization_id]
    );
    if (!order) {
      return { statusCode: 404, body: { success: false, error: 'Order not found or access denied' } };
    }

    // ✅ 返回订单详情
    return {
      statusCode: 200,
      body: { success: true, data: order },
    };
  } catch (error) {
    console.error('Error in getCustomerOrder:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'Failed to fetch order', details: error.message },
    };
  }
};