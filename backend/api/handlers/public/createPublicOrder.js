// backend/api/handlers/public/createPublicOrder.js
const { getDb } = require('../../../db/index.js');

/**
 * 匿名用户创建公共订单（小程序下单）
 * 
 * 要求：
 * - 必须提供 customer_phone（用于联系）
 * - 初始状态为 'pending'，需 ADMIN 审核后变为 'created'
 */
module.exports = async (c) => {
  try {
    const db = getDb();
    const {
      pickup_address,
      delivery_address,
      weight_kg,
      customer_name,
      customer_phone,
      description
    } = c.request.body;

    // === 1. 基础字段校验 ===
    if (
      !pickup_address ||
      !delivery_address ||
      typeof weight_kg !== 'number' ||
      weight_kg <= 0
    ) {
      return {
        statusCode: 400,
        body: { success: false, error: 'MISSING_REQUIRED_FIELDS' }
      };
    }

    // === 2. customer_phone 必填校验（核心要求）===
    if (!customer_phone || typeof customer_phone !== 'string' || !customer_phone.trim()) {
      return {
        statusCode: 400,
        body: { success: false, error: 'CUSTOMER_PHONE_REQUIRED' }
      };
    }

    const cleanPhone = customer_phone.trim();

    // === 3. 手机号格式校验（中国 11 位）===
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return {
        statusCode: 400,
        body: { success: false, error: 'INVALID_CUSTOMER_PHONE_FORMAT' }
      };
    }

    // === 4. 构建 sender_info（发件人信息）===
    const senderInfo = {
      name: (customer_name && customer_name.trim()) || '匿名用户',
      phone: cleanPhone,
      address: pickup_address.trim(),
      source: 'mini_program'
    };

    // === 5. 构建 receiver_info（收件人信息）===
    const receiverInfo = {
      address: delivery_address.trim(),
      weight_kg: weight_kg,
      description: (description && description.trim()) || ''
    };

    // === 6. 生成唯一运单号：LOG + 时间戳 + 5位大写字母 ===
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const trackingNumber = `LOG${timestamp}${randomStr}`;

    // === 7. 插入数据库（status='pending'）===
    const result = await db.run(
      `INSERT INTO orders (
        tracking_number,
        sender_info,
        receiver_info,
        status,
        customer_id,
        created_at,
        updated_at,
        customer_phone
      ) VALUES (?, ?, ?, 'pending', NULL, datetime('now'), datetime('now'), ?)`,
      [
        trackingNumber,
        JSON.stringify(senderInfo),
        JSON.stringify(receiverInfo),
        cleanPhone
      ]
    );

    const orderId = `order_${result.lastID}`;

    // === 8. 返回成功响应 ===
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          order_id: orderId,
          tracking_code: trackingNumber,
          status: 'pending', // 前端展示用，实际 DB 状态为 'pending'
          created_at: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    console.error('[createPublicOrder] Error:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_SERVER_ERROR' }
    };
  }
};