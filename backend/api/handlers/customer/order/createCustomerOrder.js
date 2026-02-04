// api/handlers/customer/order/createCustomerOrder.js
const { getDb } = require('../../../../db/index.js'); // 确保路径正确
const crypto = require('crypto');

module.exports = async (c) => {
  // 添加全面的调试日志
  console.log("\n--- [CREATE CUSTOMER ORDER HANDLER START] ---");
  console.log("Full Context Object:", c.context);
  console.log("Full Security Object:", c.security);
  console.log("Context ID:", c.context?.id);
  console.log("Security User ID:", c.security?.user?.id);
  console.log("Request Session (c.request.session):", c.request.session);
  console.log("Request Session ID (c.request.sessionID):", c.request.sessionID);
  console.log("Raw Body:", c.request.body);
  console.log("--- [END DEBUG LOGS] ---\n");

  // 尝试从 c.context 或 c.security 获取用户ID
  const userId = c.context?.id || c.security?.user?.id;
  console.log(`[DEBUG] createCustomerOrder called for userId: ${userId}`);

  if (!userId) {
    console.log('[ERROR] User ID not found in context or security.');
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'NO_USER_ID_IN_CONTEXT',
        message: 'Authentication failed: User ID not available in context.'
      }
    };
  }

  // 从前端接收完整的订单信息
  const {
    pickup_address, delivery_address, weight_kg, volume_m3,
    required_delivery_time, quote_deadline, customer_name, customer_phone,
    description, shipper_name, shipper_phone, recipient_name, recipient_phone
  } = c.request.body; // 使用 c.request.body

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

  // 2. 获取用户信息（关联 tenant_id）
  const db = getDb(); // 确保在此处获取 db 实例
  const user = await db.get('SELECT id, organization_id, tenant_id FROM users WHERE id = ?', [userId]);
  if (!user) {
    console.log(`[ERROR] User not found for userId: ${userId}`);
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    };
  }

  // 确保用户属于一个租户
  if (!user.tenant_id) {
    console.log(`[ERROR] User ${userId} is not associated with a tenant`);
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'USER_NOT_ASSOCIATED_WITH_TENANT',
        message: 'User is not associated with a tenant'
      }
    };
  }
  console.log(`[DEBUG] Found user ${userId} associated with tenant ${user.tenant_id}`);

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
      customer_tenant_id,
      tracking_number,
      sender_info,
      receiver_info,
      status,
      created_at,
      updated_at,
      quote_price,
      quote_delivery_time,
      customer_phone,
      weight_kg,
      volume_m3,
      required_delivery_time,
      quote_deadline,
      description,
      tenant_id
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.tenant_id,             // 1st -> customer_tenant_id
      tracking_number,            // 2nd -> tracking_number
      sender_info,                // 3rd -> sender_info
      receiver_info,              // 4th -> receiver_info
      status,                     // 5th -> status
      // 6th -> created_at (由 datetime('now') 填充)
      // 7th -> updated_at (由 datetime('now') 填充)
      null,                       // 8th -> quote_price
      null,                       // 9th -> quote_delivery_time
      customer_phone || null,     // 10th -> customer_phone
      weight_kg || null,          // 11th -> weight_kg
      volume_m3 || null,          // 12th -> volume_m3
      required_delivery_time || null, // 13th -> required_delivery_time
      quote_deadline || null,     // 14th -> quote_deadline
      description || null,        // 15th -> description
      user.tenant_id              // 16th -> tenant_id (这才是正确的！)
    ]
);

  // 5. 返回成功
  console.log(`[SUCCESS] Order created with ID: ${result.lastID}, Tracking Number: ${tracking_number}`);
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
};