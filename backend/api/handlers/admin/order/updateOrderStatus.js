// api/handlers/order-management/updateOrderStatus.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { id } = c.request.params;
  const { status } = c.request.body;

  const validStatuses = ['pending', 'in_transit', 'delivered', 'returned', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return {
      status: 400,
      body: { success: false, error: 'Invalid status' }
    };
  }

  const database = getDb();

  const result = await database.run(
    `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, id]
  );

  if (result.changes === 0) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found' }
    };
  }

  return {
    status: 200,
    body: { success: true, message: 'Order status updated' }
  };
};