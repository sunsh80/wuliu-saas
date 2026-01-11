// api/handlers/customer/order/deleteCustomerOrder.js
const { getDb } = require('../../../db');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.request.session?.userId;
    const orderId = c.request.params?.id;

    // 🔒 验证登录
    if (!userId) {
      return { statusCode: 401, body: { success: false, error: 'Unauthorized' } };
    }

    // 📥 验证订单 ID
    if (!orderId || typeof orderId !== 'string') {
      return { statusCode: 400, body: { success: false, error: 'Invalid order ID' } };
    }

    // 🔍 获取用户组织
    const user = await db.get('SELECT organization_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }
    const { organization_id } = user;

    // 🔐 检查订单是否存在且属于当前组织
    const existingOrder = await db.get(
      'SELECT id FROM orders WHERE id = ? AND organization_id = ?',
      [orderId, organization_id]
    );
    if (!existingOrder) {
      return { statusCode: 404, body: { success: false, error: 'Order not found or access denied' } };
    }

    // 🗑️ 执行删除
    await db.run('DELETE FROM orders WHERE id = ?', [orderId]);

    // ✅ 返回成功（204 No Content 是 RESTful 推荐，但为统一风格用 200）
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Order deleted successfully',
      },
    };
  } catch (error) {
    console.error('Error in deleteCustomerOrder:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'Failed to delete order',
        details: error.message,
      },
    };
  }
};