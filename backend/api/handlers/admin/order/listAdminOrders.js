// listAdminOrders.js
// 对应 OpenAPI: GET /api/admin/orders
// operationId: listAdminOrders

const { getDb } = require('../../../../db/index.js');

/**
 * @param {import('openapi-backend').Context} c
 */
module.exports = async (c) => {
  try {
    const db = getDb();
    const rows = await db.all(`
      SELECT 
        id, 
        customer_id, 
        tracking_number, 
        sender_info, 
        receiver_info, 
        status, 
        created_at 
      FROM orders 
      ORDER BY created_at DESC
    `);

    const orders = rows.map(row => {
      let sender = { name: 'N/A', phone: 'N/A', address: 'N/A' };
      let receiver = { name: 'N/A', phone: 'N/A', address: 'N/A' };

      try {
        sender = JSON.parse(row.sender_info);
      } catch (e) {
        // 保留默认值
      }

      try {
        receiver = JSON.parse(row.receiver_info);
      } catch (e) {
        // 保留默认值
      }

      return {
        id: row.id,
        customerId: row.customer_id,
        trackingNumber: row.tracking_number,
        sender,
        receiver,
        status: row.status,
        createdAt: row.created_at
      };
    });

    return {
      status: 200,
      body: {
        success: true,
        data: orders
      }
    };
  } catch (err) {
    console.error('❌ listAdminOrders 失败:', err.message);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_ERROR'
      }
    };
  }
};