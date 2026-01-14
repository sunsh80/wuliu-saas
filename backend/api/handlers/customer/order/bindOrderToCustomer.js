// api/handlers/customer/order/bindOrderToCustomer.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.request.session?.userId;
    const { order_id, customer_phone } = c.request.body;

    // 🔒 验证登录
    if (!userId) {
      return { statusCode: 401, body: { success: false, error: 'Unauthorized' } };
    }

    // 📥 验证请求参数
    if (!order_id || typeof order_id !== 'string') {
      return { statusCode: 400, body: { success: false, error: 'Valid order_id is required' } };
    }
    if (!customer_phone || typeof customer_phone !== 'string') {
      return { statusCode: 400, body: { success: false, error: 'Valid customer_phone is required' } };
    }

    // 🔍 获取当前用户组织
    const user = await db.get('SELECT organization_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }
    const { organization_id } = user;

    // 🔐 检查订单是否存在、属于当前组织、且尚未绑定客户
    const order = await db.get(
      `SELECT id, customer_id
       FROM orders
       WHERE id = ? AND organization_id = ? AND customer_id IS NULL`,
      [order_id, organization_id]
    );
    if (!order) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'Order not found, already bound, or access denied',
        },
      };
    }

    // 🔍 查找客户（必须在同一组织）
    const customer = await db.get(
      `SELECT id
       FROM customers
       WHERE phone = ? AND organization_id = ?`,
      [customer_phone, organization_id]
    );
    if (!customer) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'No customer found with this phone number in your organization',
        },
      };
    }

    // 🔄 执行绑定
    await db.run(
      'UPDATE orders SET customer_id = ?, updated_at = datetime("now") WHERE id = ?',
      [customer.id, order_id]
    );

    // ✅ 返回成功
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Order bound to customer successfully',
        data: {
          order_id: order_id,
          customer_id: customer.id,
        },
      },
    };
  } catch (error) {
    console.error('Error in bindOrderToCustomer:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'Failed to bind order to customer',
        details: error.message,
      },
    };
  }
};