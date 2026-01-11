// listCarrierOrders.js
// 对应 OpenAPI: GET /carrier/orders

const { getDb } = require('../../../../db');

/**
 * @param {import('openapi-backend').Context} c
 */
module.exports = async (c) => {
  const { userId } = c.request.auth; // 假设 carrier 已登录

  try {
    const db = getDb();
    const orders = await db.all(
      `SELECT id, status, pickup_address, delivery_address, created_at 
       FROM orders 
       WHERE carrier_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return {
      status: 200,
      body: { success: true, data: orders }
    };
  } catch (err) {
    console.error('❌ listCarrierOrders 失败:', err.message);
    return {
      status: 500,
      body: { success: false, error: 'INTERNAL_ERROR' }
    };
  }
};