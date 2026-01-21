// api/handlers/carrier/order/completeCarrierOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  // 从 JWT 获取当前承运商租户 ID
const { tenantId, roles } = c.context;

// 校验 carrier 角色
if (!roles.includes('carrier')) {
  return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
}

  // 从 URL 路径获取 orderId（OpenAPI 定义为路径参数）
  const { orderId } = c.req.param();

  if (!orderId) {
    return {
      status: 400,
      body: { success: false, error: 'Missing orderId' }
    };
  }

  const db = getDb();

  // 检查订单是否存在、状态为 'in_transit'、且属于当前租户
  const order = await db.get(
    `SELECT id FROM orders WHERE id = ? AND status = 'in_transit' AND carrier_id = ?`,
    [orderId, tenantId]
  );

  if (!order) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found or cannot be completed' }
    };
  }

  // 执行完成：状态改为 'delivered'，记录 completed_at
  await db.run(
    `UPDATE orders 
     SET status = 'delivered', 
         completed_at = datetime('now'), 
         updated_at = datetime('now') 
     WHERE id = ?`,
    [orderId]
  );

  // 查询更新后的订单（返回关键字段）
  const updatedOrder = await db.get(
    `SELECT id, status, carrier_id, completed_at FROM orders WHERE id = ?`,
    [orderId]
  );

  // 返回成功响应（对齐 OpenAPI 建议结构）
  return {
    status: 200,
    body: {
      success: true,
      message: 'Order completed successfully',
      order: updatedOrder
    }
  };
};