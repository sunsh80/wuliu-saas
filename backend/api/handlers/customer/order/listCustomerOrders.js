// api/handlers/customer/order/listCustomerOrders.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.request.session?.userId;

    // 🔒 验证登录状态
    if (!userId) {
      return { statusCode: 401, body: { success: false, error: 'Unauthorized' } };
    }

    // 📥 获取查询参数（支持分页）
    const page = parseInt(c.request.query.page) || 1;
    const limit = Math.min(parseInt(c.request.query.limit) || 10, 100); // 最大100条
    const offset = (page - 1) * limit;

    // 🔍 获取当前用户所属组织
    const user = await db.get('SELECT organization_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }
    const { organization_id } = user;

    // 📊 查询总订单数（用于分页）
    const totalResult = await db.get(
      'SELECT COUNT(*) as total FROM orders WHERE organization_id = ?',
      [organization_id]
    );
    const total = totalResult?.total || 0;

    // 📋 查询订单列表（按创建时间倒序）
    const orders = await db.all(
      `SELECT id, tracking_number, sender_info, receiver_info, status, customer_id,
              created_at, updated_at
       FROM orders
       WHERE organization_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [organization_id, limit, offset]
    );

    // ✅ 返回分页结果
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          orders,
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
        error: 'Failed to fetch orders',
        details: error.message,
      },
    };
  }
};