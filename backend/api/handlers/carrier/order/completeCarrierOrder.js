// api/handlers/carrier/order/completeCarrierOrder.js
const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const { orderId, deliveryProof } = c.request.body;
  const { userId } = c.request.auth; // 假设 carrier 用户已登录

  if (!orderId) {
    return {
      status: 400,
      body: { success: false, error: 'Missing orderId' }
    };
  }

  const db = getDb();

  // 检查订单是否存在，且属于当前 carrier，且状态为 in_transit
  const order = await db.get(
    `SELECT id, carrier_id, status 
     FROM orders 
     WHERE id = ? AND carrier_id = ? AND status = 'in_transit'`,
    [orderId, userId]
  );

  if (!order) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found, not assigned to you, or not in transit' }
    };
  }

  // 完成订单：更新状态为 completed，记录完成时间
  await db.run(
    `UPDATE orders 
     SET status = 'completed', 
         delivery_proof = ?, 
         completed_at = datetime('now'),
         updated_at = datetime('now')
     WHERE id = ?`,
    [deliveryProof || null, orderId]
  );

  return {
    status: 200,
    body: { success: true, message: 'Order completed successfully' }
  };
};