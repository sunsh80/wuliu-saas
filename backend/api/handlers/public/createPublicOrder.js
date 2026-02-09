// api/handlers/public/createPublicOrder.js
const { getDb } = require('../../../db/index.js');
const crypto = require('crypto');

module.exports = async (c) => {
  try {
    const db = getDb();

    // 从前端接收订单信息（支持匿名下单）
    const {
      pickup_address,
      delivery_address,
      weight_kg,
      volume_m3,
      required_delivery_time,
      quote_deadline,
      customer_name,
      customer_phone,
      description,
      shipper_name,
      shipper_phone,
      recipient_name,
      recipient_phone
    } = c.request.body;

    // 1. 验证请求体
    if (!pickup_address || !delivery_address || !customer_phone) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Pickup address, delivery address and customer phone are required'
        }
      };
    }

    // 2. 构造订单数据
    const tracking_number = `ORD-${Date.now()}`;
    const status = 'pending';
    const order_id = crypto.randomUUID();

    // 构造发货人信息
    const sender_info = JSON.stringify({
      name: shipper_name || customer_name,
      phone: shipper_phone || customer_phone,
      address: pickup_address,
      source: 'mobile_app_anonymous'
    });

    // 构造收货人信息
    const receiver_info = JSON.stringify({
      name: recipient_name || customer_name,
      phone: recipient_phone || customer_phone,
      address: delivery_address,
      source: 'mobile_app_anonymous'
    });

    // 3. 插入数据库（匿名订单，customer_tenant_id为NULL或使用phone作为标识）
    const result = await db.run(
      `INSERT INTO orders (
         customer_tenant_id, tracking_number, sender_info, receiver_info,
         status, created_at, updated_at, quote_price, quote_delivery_time,
         quote_remarks, quote_deadline, customer_phone, weight_kg, volume_m3, 
         required_delivery_time, description, cargo_type
       )
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null, // 匿名订单，customer_tenant_id为NULL
        tracking_number,
        sender_info,
        receiver_info,
        status,
        null, // quote_price (可选)
        null, // quote_delivery_time (可选)
        null, // quote_remarks (可选)
        quote_deadline || null,
        customer_phone,
        weight_kg || null,
        volume_m3 || null,
        required_delivery_time || null,
        description || null,
        cargo_type || null
      ]
    );

    // 4. 返回成功
    return {
      statusCode: 201,
      body: {
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: tracking_number, // 使用跟踪号作为订单ID
          tracking_number: tracking_number,
          status: status,
          customer_phone: customer_phone // 返回客户电话，用于后续查询
        }
      }
    };
  } catch (error) {
    console.error('Error in createPublicOrder:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error.message
      }
    };
  }
};