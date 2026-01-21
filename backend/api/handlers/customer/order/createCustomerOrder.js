// api/handlers/customer/order/createCustomerOrder.js
const { getDb } = require('../../../../db/index.js');
const crypto = require('crypto');

module.exports = async (c, req, res) => {
  try {
    const db = getDb();
    const userId = c.context?.id; // 👈 来自 session

    const { total_amount, items } = c.request.body;

    // 1. 验证请求体
    if (typeof total_amount !== 'number') {
      return { statusCode: 400, body: { success: false, error: 'Total amount must be a number' } };
    }
    if (typeof items !== 'string' || !items) {
      return { statusCode: 400, body: { success: false, error: 'Items must be a non-empty JSON string' } };
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(items);
    } catch (e) {
      return { statusCode: 400, body: { success: false, error: 'Items must be a valid JSON string' } };
    }
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return { statusCode: 400, body: { success: false, error: 'Items must be a non-empty JSON array' } };
    }

    // 2. 获取用户信息（关联 customer_id）
    const user = await db.get('SELECT id, organization_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { statusCode: 403, body: { success: false, error: 'User not found' } };
    }

    // 尝试查找该用户的 customer 记录
    const customer = await db.get('SELECT id FROM customers WHERE phone = (SELECT phone FROM users WHERE id = ?)', [userId]);
    const customerId = customer ? customer.id : null;

    // 3. 构造订单数据
    const receiver_info = JSON.stringify(parsedItems[0]);
    const sender_info = JSON.stringify({ source: 'web_app', user_id: userId });
    const tracking_number = `TRK${Date.now()}`;
    const status = 'pending';
    const order_id = 'order_' + crypto.randomUUID();

    // 4. 插入数据库
    await db.run(
      `INSERT INTO orders (id, customer_id, tracking_number, sender_info, receiver_info, status, organization_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [order_id, customerId, tracking_number, sender_info, receiver_info, status, user.organization_id]
    );

    // 5. 返回成功
    return {
      statusCode: 201,
      body: {
        success: true,
        message: 'Order created successfully',
        data: { id: order_id, tracking_number: tracking_number },
      },
    };
  } catch (error) {
    console.error('Error in createCustomerOrder:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'Internal server error', details: error.message },
    };
  }
};