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

    // 修正 SQL 查询，使用数据库中存在的 'customer_tenant_id' 列
    const rows = await db.all(`
      SELECT id, customer_tenant_id, tracking_number, sender_info, receiver_info, status, created_at 
      FROM orders 
      ORDER BY created_at DESC
    `);

    const orders = rows.map(row => {
      let sender = { name: 'N/A', phone: 'N/A', address: 'N/A' };
      let receiver = { name: 'N/A', phone: 'N/A', address: 'N/A' };

      try {
        sender = JSON.parse(row.sender_info);
      } catch (e) {
        // console.error('解析发货人信息失败:', e.message); // 可选：记录解析错误
      }
      try {
        receiver = JSON.parse(row.receiver_info);
      } catch (e) {
        // console.error('解析收货人信息失败:', e.message); // 可选：记录解析错误
      }

      return {
        id: row.id,
        // 修正返回字段名，使其与数据库列名及业务逻辑一致
        createdByTenantId: row.customer_tenant_id, // 表示创建订单的租户ID
        trackingNumber: row.tracking_number,
        sender,
        receiver,
        status: row.status,
        createdAt: row.created_at
      };
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          total: orders.length,
          page: 1,  // 默认第一页
          limit: orders.length,  // 限制为实际返回的数量
          orders: orders
        }
      }
    };
  } catch (err) {
    console.error('❌ listAdminOrders 失败:', err.message);
    // 考虑返回更详细的错误信息（但在生产环境中要小心暴露内部细节）
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_ERROR'
      }
    };
  }
};