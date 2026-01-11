// api/handlers/public/createPublicOrder.js
const { getDb } = require('../../../db');
const crypto = require('crypto');

module.exports = async (c) => {
  try {
    const db = getDb();
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

    // 2. 处理数据
    const receiver_info = JSON.stringify(parsedItems[0]);
    const sender_info = JSON.stringify({ source: 'mini_program', items_count: parsedItems.length });
    const tracking_number = `TRK${Date.now()}`;
    const status = 'pending';
    const default_organization_id = 'admin_org_id_001';
    const order_id = 'order_' + crypto.randomUUID();

    // 3. 插入数据库
    await db.run(
      `INSERT INTO orders (id, tracking_number, sender_info, receiver_info, status, organization_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [order_id, tracking_number, sender_info, receiver_info, status, default_organization_id]
    );

    // 4. 返回成功
    return {
      statusCode: 201,
      body: {
        success: true,
        message: 'Order created successfully',
        data: {
          id: order_id,
          tracking_number: tracking_number,
        },
      },
    };
  } catch (error) {
    console.error('Error in createPublicOrder:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
    };
  }
};