// api/handlers/carrier/order/claimCarrierOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  // 从 JWT 获取当前承运商租户 ID（不是 userId）
  const { tenantId } = c.request.auth;

  // 从 URL 路径获取 orderId（OpenAPI 定义为路径参数）
  const { orderId } = c.req.param();

  if (!orderId) {
    return {
      status: 400,
      body: { success: false, error: 'Missing orderId' }
    };
  }

  const db = getDb();

  // 检查订单是否存在、状态为 'created'（符合 OpenAPI）
  const order = await db.get(
    `SELECT id FROM orders WHERE id = ? AND status = 'created'`,
    [orderId]
  );

  if (!order) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found or not available' }
    };
  }

  // 执行认领：绑定 carrier_id（租户ID），状态改为 in_transit
  await db.run(
    `UPDATE orders SET carrier_id = ?, status = 'in_transit', updated_at = datetime('now') WHERE id = ?`,
    [tenantId, orderId]
  );

  // 查询更新后的订单（至少包含关键字段）
const updatedOrder = await db.get(
  `SELECT 
     id, customer_id, carrier_id, tracking_number,
     sender_info, receiver_info, status, completed_at,
     created_at, updated_at, volume_m3,
     required_delivery_time, quote_deadline
   FROM orders WHERE id = ?`,
  [orderId]
);

  // 返回成功响应（对齐 OpenAPI 建议结构）
  return {
    status: 200,
    body: {
      success: true,
      message: 'Order claimed successfully',
      order: updatedOrder
    }
  };
};