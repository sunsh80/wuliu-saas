// backend/api/handlers/carrier/order/getCarrierActiveOrders.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商活跃订单查询处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to get active orders for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  // 检查角色
  if (!c.context.roles.includes('carrier')) {
    console.log("User does not have 'carrier' role.");
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 查询承运商当前所有活跃订单
    const activeOrders = await db.all(`
      SELECT 
        o.id,
        o.tracking_number,
        o.sender_info,
        o.receiver_info,
        o.weight_kg,
        o.volume_m3,
        o.status,
        o.created_at,
        o.updated_at,
        o.quote_deadline,
        o.description,
        o.cargo_type,
        -- 获取该承运商对此订单的报价
        q.quote_price,
        q.quote_delivery_time,
        q.quote_remarks,
        -- 计算还有多少承运商对此订单进行了报价
        (SELECT COUNT(*) FROM quotes q2 WHERE q2.order_id = o.id) as total_quotes_count
      FROM orders o
      LEFT JOIN quotes q ON q.order_id = o.id AND q.carrier_id = ?
      WHERE o.carrier_id = ?
      AND o.status IN ('pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit')
      ORDER BY o.created_at DESC
    `, [userId, userId]);

    console.log(`✅ Found ${activeOrders.length} active orders for carrier ${userId}`);

    // 格式化订单数据
    const formattedOrders = activeOrders.map(order => {
      let sender = {}, receiver = {};
      try { sender = order.sender_info ? JSON.parse(order.sender_info) : {}; } catch (e) {}
      try { receiver = order.receiver_info ? JSON.parse(order.receiver_info) : {}; } catch (e) {}

      return {
        id: order.id,
        tracking_number: order.tracking_number,
        sender_info: sender,
        receiver_info: receiver,
        weight_kg: order.weight_kg,
        volume_m3: order.volume_m3,
        status: order.status,
        status_text: getStatusText(order.status),
        created_at: order.created_at,
        updated_at: order.updated_at,
        quote_deadline: order.quote_deadline,
        description: order.description,
        cargo_type: order.cargo_type,
        // 承运商自己的报价信息
        my_quote: order.quote_price ? {
          price: order.quote_price,
          delivery_time: order.quote_delivery_time,
          remarks: order.quote_remarks
        } : null,
        // 该订单总共收到的报价数
        total_quotes_received: order.total_quotes_count || 0
      };
    });

    // 获取承运商的配置信息（如最大活跃订单数）
    const carrierConfig = await db.get(`
      SELECT 
        t.service_radius_km,
        t.capacity_kg,
        t.capacity_m3,
        t.base_price_per_km,
        t.avg_rating
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      WHERE u.id = ?
    `, [userId]);

    return {
      status: 200,
      body: {
        success: true,
        message: '获取活跃订单成功',
        data: {
          orders: formattedOrders,
          summary: {
            total_active_orders: formattedOrders.length,
            max_allowed_orders: c.context.max_active_orders || 3,
            capacity_info: carrierConfig || {}
          }
        }
      }
    };

  } catch (error) {
    console.error('💥 [ACTIVE ORDERS HANDLER ERROR]:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR', 
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' 
      } 
    };
  }
};

// 辅助函数：获取状态文本
function getStatusText(status) {
  const statusMap = {
    'created': '已创建',
    'pending_claim': '待认领',
    'claimed': '已认领',
    'quoted': '已报价',
    'awarded': '已分配',
    'dispatched': '已发车',
    'in_transit': '运输中',
    'delivered': '已送达',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}