// api/handlers/carrier/order/claimCarrierOrder.js
const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const { orderId } = c.request.body;
  const { userId } = c.request.auth; // 假设已登录，从 auth 中获取 carrier 用户 ID

  if (!orderId) {
    return {
      status: 400,
      body: { success: false, error: 'Missing orderId' }
    };
  }

  const db = getDb();

  // 检查订单是否存在且可被认领（例如状态为 pending）
  const order = await db.get(
    `SELECT id, status FROM orders WHERE id = ? AND status = 'pending'`,
    [orderId]
  );

  if (!order) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found or not available' }
    };
  }

  // 更新订单：绑定 carrier_id，状态改为 in_transit
  await db.run(
    `UPDATE orders SET carrier_id = ?, status = 'in_transit', updated_at = datetime('now')
     WHERE id = ?`,
    [userId, orderId]
  );

  return {
    status: 200,
    body: { success: true, message: 'Order claimed successfully' }
  };
};