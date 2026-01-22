// api/handlers/customer/order/getCustomerOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const orderId = c.request.params?.orderId;

    // 📥 验证订单 ID
    if (!orderId) {
      return { status: 400, body: { success: false, error: 'Invalid order ID' } };
    }

    // 🔐 查询订单（必须属于当前客户租户）
    const order = await db.get(
      `SELECT * FROM orders WHERE id = ? AND tenant_id = ?`,
      [orderId, c.context.tenantId]
    );
    if (!order) {
      return { status: 404, body: { success: false, error: 'Order not found or access denied' } };
    }

    // 解析 JSON 字段
    let senderInfo = {}, receiverInfo = {};
    try { senderInfo = JSON.parse(order.sender_info); } catch (e) {}
    try { receiverInfo = JSON.parse(order.receiver_info); } catch (e) {}

    // 获取承运商信息（如果已分配）
    let carrierInfo = null;
    if (order.carrier_id) {
      const carrierUser = await db.get(
        `SELECT u.name as carrier_name, u.email, t.name as tenant_name, t.contact_person, t.contact_phone
         FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = ?`,
        [order.carrier_id]
      );

      if (carrierUser) {
        carrierInfo = {
          id: order.carrier_id,
          name: carrierUser.carrier_name || carrierUser.tenant_name,
          email: carrierUser.email,
          tenant_name: carrierUser.tenant_name,
          contact_person: carrierUser.contact_person,
          contact_phone: carrierUser.contact_phone
        };
      }
    }

    // 构建响应对象
    const orderData = {
      id: order.id,
      tracking_number: order.tracking_number,
      sender_info: senderInfo,
      receiver_info: receiverInfo,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      carrier: carrierInfo
    };

    // 如果订单有报价信息，也一并返回
    if (order.quote_price) {
      orderData.quote = {
        price: order.quote_price,
        delivery_time: order.quote_delivery_time,
        remarks: order.quote_remarks
      };
    }

    // ✅ 返回订单详情
    return {
      status: 200,
      body: { success: true, data: orderData },
    };
  } catch (error) {
    console.error('Error in getCustomerOrder:', error);
    return {
      status: 500,
      body: { success: false, error: 'Failed to fetch order', details: error.message },
    };
  }
};