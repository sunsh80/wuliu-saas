// backend/api/handlers/public/createPublicOrder.js
const { getDb } = require('../../../db/index.js');
const crypto = require('crypto');

module.exports = async (c) => {
  try {
    const db = getDb();
    const {
      pickup_address,        // 发货地
      delivery_address,      // 收货地
      weight_kg,             // 重量
      customer_name,         // 客户姓名（可选）
      customer_phone,        // 客户电话（可选）
      description            // 描述（体积+备注，可选）
    } = c.request.body;

    // === 校验必填字段（根据 OpenAPI）===
    if (!pickup_address?.trim()) {
      return { statusCode: 400, body: { error: 'MISSING_PICKUP_ADDRESS' } };
    }
    if (!delivery_address?.trim()) {
      return { statusCode: 400, body: { error: 'MISSING_DELIVERY_ADDRESS' } };
    }
    if (typeof weight_kg !== 'number' || weight_kg <= 0) {
      return { statusCode: 400, body: { error: 'INVALID_WEIGHT' } };
    }

    // === 构建 sender_info（发件人）===
    // 小程序匿名下单，发件人信息来自表单
    const sender_info = JSON.stringify({
      name: customer_name?.trim() || '匿名用户',
      phone: customer_phone?.trim() || '',
      address: pickup_address.trim(),
      source: 'mini_program'
    });

    // === 构建 receiver_info（收件人）===
    // 注意：小程序未提供收件人姓名/电话，只能从地址推断
    // 如果未来需要，可在前端增加字段
    const receiver_info = JSON.stringify({
      address: delivery_address.trim(),
      weight_kg: weight_kg,
      description: description?.trim() || ''
    });

    // === 生成唯一 ID 和运单号 ===
    const order_id = 'order_' + crypto.randomUUID();
    const tracking_number = 'LOG' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // === 插入数据库（严格匹配你的表结构）===
    await db.run(`
      INSERT INTO orders (
        id,
        tracking_number,
        sender_info,
        receiver_info,
        status,
        customer_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'created', NULL, datetime('now'), datetime('now'))
    `, [
      order_id,
      tracking_number,
      sender_info,
      receiver_info
    ]);

    // === 返回成功响应 ===
    return {
      statusCode: 201,
      body: {
        order_id,
        tracking_code: tracking_number, // 兼容前端可能叫 tracking_code
        status: 'pending',
        created_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ [createPublicOrder] Error:', error.message);
    return {
      statusCode: 500,
      body: { error: 'INTERNAL_SERVER_ERROR' }
    };
  }
};