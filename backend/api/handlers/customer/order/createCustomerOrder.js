// api/handlers/customer/order/createCustomerOrder.js
const { getDb } = require('../../../../db/index.js');
const crypto = require('crypto');

module.exports = async (c) => {
  try {
    const db = getDb();
    const userId = c.context?.id; // 从认证上下文获取用户ID

    // 从前端接收完整的订单信息
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
    if (!pickup_address || !delivery_address) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Pickup address and delivery address are required'
        }
      };
    }

    // 2. 获取用户信息（关联 customer_id）
    const user = await db.get('SELECT id, organization_id, tenant_id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return {
        statusCode: 403,
        body: {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    // 3. 构造订单数据
    const tracking_number = `ORD-${Date.now()}`;
    const status = 'pending';
    const order_id = crypto.randomUUID();

    // 构造发货人信息
    const sender_info = JSON.stringify({
      name: shipper_name || customer_name,
      phone: shipper_phone || customer_phone,
      address: pickup_address,
      source: 'mobile_app'
    });

    // 构造收货人信息
    const receiver_info = JSON.stringify({
      name: recipient_name || customer_name,
      phone: recipient_phone || customer_phone,
      address: delivery_address,
      source: 'mobile_app'
    });

    // 4. 插入数据库
    const result = await db.run(
      `INSERT INTO orders (
         customer_id, tracking_number, sender_info, receiver_info, 
         status, created_at, updated_at, quote_price, quote_delivery_time,
         customer_phone, weight_kg, volume_m3, required_delivery_time, quote_deadline,
         description
       )
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, // 使用用户ID作为customer_id
        tracking_number,
        sender_info,
        receiver_info,
        status,
        null, // quote_price (可选)
        required_delivery_time || null,
        customer_phone || null,
        weight_kg || null,
        volume_m3 || null,
        required_delivery_time || null,
        quote_deadline || null,
        description || null
      ]
    );

    // 5. 返回成功
    return {
      statusCode: 201,
      body: {
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: tracking_number, // 使用跟踪号作为订单ID
          tracking_number: tracking_number,
          status: status
        }
      }
    };
  } catch (error) {
    console.error('Error in createCustomerOrder:', error);
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