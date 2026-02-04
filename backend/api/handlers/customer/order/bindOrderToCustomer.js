// api/handlers/customer/order/bindOrderToCustomer.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c, req, res) => {
  try {
    // 🔒 1. 检查是否已登录（由 TenantSessionAuth 注入）
    if (!c.context?.id) {
      return { statusCode: 401, body: { success: false, error: 'Unauthorized' } };
    }

    const userId = c.context?.id;
    const db = getDb();
    const { order_id } = c.request.body;
    console.log(' → order_id value:', order_id, 'type:', typeof order_id);
    // 📥 2. 参数校验
   if (!order_id || (typeof order_id !== 'string' && typeof order_id !== 'number')) {
    return { statusCode: 400, body: { success: false, error: 'Valid order_id is required' } };
}
// 可选：将 order_id 转换为字符串进行数据库查询
// order_id = String(order_id);

    // 🔐 3. 查询用户组织（用于租户隔离）
    const userOrg = await db.get(
      'SELECT organization_id FROM users WHERE id = ?',
      [userId]
    );
    if (!userOrg) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }

    // 🔍 4. 检查订单是否存在、属于当前租户、且未绑定
    const order = await db.get(
      'SELECT id FROM orders WHERE id = ? AND type_user IS NULL',
      [order_id]
    );
    if (!order) {
      return { 
        statusCode: 404, 
        body: { success: false, error: 'Order not found or already bound' } 
      };
    }

    // 🔄 5. 执行绑定（核心！）
    await db.run(
      'UPDATE orders SET type_user = ?, updated_at = datetime("now") WHERE id = ?',
      [userId, order_id]
    );

    // ✅ 6. 返回成功
    return {
      statusCode: 200,
      body: { 
        success: true, 
        message: 'Order bound to current user successfully'
      }
    };

  } catch (error) {
    console.error('BindOrderToCustomer Error:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'Internal server error' }
    };
  }
};