// api/handlers/customer/order/updateCustomerOrder.js
const { getDb } = require('../../../db');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.request.session?.userId;
    const orderId = c.request.params?.id;
    const updates = c.request.body;

    // 🔒 验证登录
    if (!userId) {
      return { statusCode: 401, body: { success: false, error: 'Unauthorized' } };
    }

    // 📥 验证订单 ID
    if (!orderId || typeof orderId !== 'string') {
      return { statusCode: 400, body: { success: false, error: 'Invalid order ID' } };
    }

    // 🧾 至少需要一个可更新字段
    const allowedFields = ['status', 'receiver_info', 'sender_info'];
    const updateFields = {};
    let hasValidUpdate = false;

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        if (field === 'status') {
          const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
          if (!validStatuses.includes(updates.status)) {
            return {
              statusCode: 400,
              body: { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
            };
          }
        } else if (typeof updates[field] !== 'string') {
          return {
            statusCode: 400,
            body: { success: false, error: `${field} must be a string` },
          };
        }
        updateFields[field] = updates[field];
        hasValidUpdate = true;
      }
    }

    if (!hasValidUpdate) {
      return {
        statusCode: 400,
        body: { success: false, error: 'At least one updatable field (status, receiver_info, sender_info) must be provided' },
      };
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

    // 🛠️ 构建动态 UPDATE 语句
    const setClause = Object.keys(updateFields)
      .map((field) => `${field} = ?`)
      .join(', ');
    const values = [...Object.values(updateFields), new Date().toISOString(), orderId, organization_id];

    await db.run(
      `UPDATE orders
       SET ${setClause}, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
      values
    );

    // ✅ 返回成功
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Order updated successfully',
      },
    };
  } catch (error) {
    console.error('Error in updateCustomerOrder:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'Failed to update order',
        details: error.message,
      },
    };
  }
};