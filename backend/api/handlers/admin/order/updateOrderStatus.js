// api/handlers/order-management/updateOrderStatus.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { id } = c.request.params;
  const { status, tenant_id, carrier_id } = c.request.body; // ← 解构 tenant_id 和 carrier_id

  // 🔧 扩展状态白名单（包含 pending_claim）
  const validStatuses = [
    'pending',
    'pending_claim',   // ← 关键：承运商可认领状态
    'available',
    'in_transit',
    'delivered',
    'returned',
    'cancelled'
  ];

  if (!status || !validStatuses.includes(status)) {
    console.error(`[updateOrderStatus] Invalid status: ${status}`);
    return { status: 400, body: { success: false, error: 'Invalid status' } };
  }

  const database = getDb();
  let result;

  try {
    if (carrier_id !== undefined && tenant_id !== undefined) {
      // ✅ 同时更新 status、tenant_id 和 carrier_id（管理员指派给特定承运商）
      console.log(`[updateOrderStatus] Updating order ${id} to status=${status}, tenant_id=${tenant_id}, carrier_id=${carrier_id}`);
      result = await database.run(
        `UPDATE orders
         SET status = ?, tenant_id = ?, carrier_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, tenant_id, carrier_id, id]
      );
    } else if (tenant_id !== undefined) {
      // ✅ 同时更新 status 和 tenant_id（仅更新租户，不指定承运商）
      console.log(`[updateOrderStatus] Updating order ${id} to status=${status}, tenant_id=${tenant_id}`);
      result = await database.run(
        `UPDATE orders
         SET status = ?, tenant_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, tenant_id, id]
      );
    } else if (carrier_id !== undefined) {
      // ✅ 同时更新 status 和 carrier_id（仅更新承运商）
      console.log(`[updateOrderStatus] Updating order ${id} to status=${status}, carrier_id=${carrier_id}`);
      result = await database.run(
        `UPDATE orders
         SET status = ?, carrier_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, carrier_id, id]
      );
    } else {
      // ✅ 仅更新 status（如取消订单）
      console.log(`[updateOrderStatus] Updating order ${id} to status=${status} (no tenant/carrier change)`);
      result = await database.run(
        `UPDATE orders
         SET status = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, id]
      );
    }

    if (result.changes === 0) {
      console.warn(`[updateOrderStatus] Order not found: id=${id}`);
      return { status: 404, body: { success: false, error: 'Order not found' } };
    }

    console.log(`[updateOrderStatus] Order ${id} updated successfully`);
    return { status: 200, body: { success: true, message: 'Order status updated' } };

  } catch (err) {
    console.error(`[updateOrderStatus] Database error:`, err);
    return { status: 500, body: { success: false, error: 'Database error' } };
  }
};