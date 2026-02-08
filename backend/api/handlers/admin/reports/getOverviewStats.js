// backend/api/handlers/admin/reports/getOverviewStats.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const db = getDb();

  try {
    // 获取订单统计
    const totalOrdersResult = await db.get('SELECT COUNT(*) as count FROM orders');
    const completedOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'");
    const inTransitOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'in_transit' OR status = 'dispatched'");
    const pendingOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'pending_claim', 'available')");
    const processingOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('claimed', 'quoted', 'awarded')");
    const cancelledOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'");
    
    // 获取客户统计
    const totalCustomersResult = await db.get('SELECT COUNT(*) as count FROM tenants WHERE JSON_EXTRACT(roles, \'$[0]\') = \'customer\' OR JSON_EXTRACT(roles, \'$[1]\') = \'customer\'');
    
    // 获取最近订单
    const recentOrders = await db.all(`
      SELECT 
        o.id,
        o.tracking_number,
        o.sender_info,
        o.receiver_info,
        o.status,
        o.created_at,
        o.weight_kg,
        t.name as customer_tenant_name
      FROM orders o
      LEFT JOIN tenants t ON o.customer_tenant_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // 处理订单数据，解析JSON字段
    const processedOrders = recentOrders.map(order => {
      let senderInfo = {};
      let receiverInfo = {};
      
      try {
        senderInfo = typeof order.sender_info === 'string' ? JSON.parse(order.sender_info) : order.sender_info || {};
      } catch(e) {
        console.warn('解析发货信息失败:', e);
      }
      
      try {
        receiverInfo = typeof order.receiver_info === 'string' ? JSON.parse(order.receiver_info) : order.receiver_info || {};
      } catch(e) {
        console.warn('解析收货信息失败:', e);
      }
      
      return {
        ...order,
        sender_info: senderInfo,
        receiver_info: receiverInfo
      };
    });

    // 返回统计数据
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          total_orders: totalOrdersResult.count || 0,
          completed_orders: completedOrdersResult.count || 0,
          in_transit_orders: inTransitOrdersResult.count || 0,
          pending_orders: pendingOrdersResult.count || 0,
          processing_orders: processingOrdersResult.count || 0,
          cancelled_orders: cancelledOrdersResult.count || 0,
          total_customers: totalCustomersResult.count || 0,
          recent_orders: processedOrders
        }
      }
    };
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while retrieving report statistics'
      }
    };
  }
};