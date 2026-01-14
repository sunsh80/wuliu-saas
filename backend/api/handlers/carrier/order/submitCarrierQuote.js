// src/routes/quoteCarrierOrder.js
const db = require('../../../../db/index.js');

async function quoteCarrierOrder(req, res) {
  const { order_id } = req.params;
  const carrierId = req.user.tenantId;
  const { price, estimated_delivery_time, remarks } = req.body;

  // 验证输入
  if (!price || price <= 0) {
    return res.status(400).json({ error: "INVALID_PRICE", message: "报价必须大于0" });
  }

  try {
    // 检查订单是否存在且处于可报价状态
    const order = await db.get(
      `SELECT id, status, carrier_id FROM orders WHERE id = ?`,
      [order_id]
    );

    if (!order) {
      return res.status(404).json({ error: "ORDER_NOT_FOUND", message: "订单不存在" });
    }

    if (order.status !== 'created') {
      return res.status(403).json({ error: "ORDER_NOT_QUOTABLE", message: "订单不可报价" });
    }

    // 检查是否已被其他承运商认领
    if (order.carrier_id) {
      return res.status(403).json({ error: "ALREADY_ASSIGNED", message: "该订单已被其他承运商认领" });
    }

    // 更新订单状态为 quoted，并记录报价信息
    await db.run(
      `UPDATE orders 
       SET 
         status = 'quoted',
         carrier_id = ?,
         quote_price = ?,
         quote_delivery_time = ?,
         quote_remarks = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
      [carrierId, price, estimated_delivery_time, remarks, order_id]
    );

    // 返回完整订单对象（含新字段）
    const updatedOrder = await db.get(`
      SELECT 
        id, customer_id, carrier_id, tracking_number,
        sender_info, receiver_info, status, completed_at,
        created_at, updated_at, volume_m3,
        required_delivery_time, quote_deadline,
        quote_price, quote_delivery_time, quote_remarks
      FROM orders 
      WHERE id = ?`, 
      [order_id]
    );

    res.json(updatedOrder);
  } catch (err) {
    console.error('Quote order error:', err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "操作失败" });
  }
}

module.exports = quoteCarrierOrder;