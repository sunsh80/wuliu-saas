// backend/api/handlers/tenant-web/quotes/listCarrierQuotes.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const db = getDb();
  
  // 从上下文获取承运商ID
  const carrierId = c.context?.id;
  const carrierRoles = c.context?.roles;

  // 验证用户是否为承运商
  if (!carrierId || !carrierRoles || !carrierRoles.includes('carrier')) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'FORBIDDEN',
        message: '只有承运商才能查看报价列表'
      }
    };
  }

  // 获取分页参数
  const page = parseInt(c.request.query.page) || 1;
  const limit = parseInt(c.request.query.limit) || 10;
  const offset = (page - 1) * limit;
  const statusFilter = c.request.query.status; // 状态过滤参数

  try {
    // 构建查询条件
    let whereClause = 'WHERE q.carrier_id = ? ';
    const params = [carrierId];

    if (statusFilter) {
      // 根据状态过滤，需要关联订单状态
      whereClause += 'AND o.status = ? ';
      params.push(statusFilter);
    }

    // 获取报价总数用于分页
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM quotes q
      JOIN orders o ON q.order_id = o.id
      ${whereClause}
    `, params);

    const totalItems = countResult.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // 获取报价列表，关联订单和租户信息
    const quotes = await db.all(`
      SELECT
        q.id as quote_id,
        q.order_id,
        o.tracking_number,
        o.sender_info,
        o.receiver_info,
        q.quote_price,
        q.quote_delivery_time,
        q.quote_remarks,
        o.status as order_status,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        t.name as customer_tenant_name,
        t.contact_person as customer_contact_person,
        t.contact_phone as customer_contact_phone
      FROM quotes q
      JOIN orders o ON q.order_id = o.id
      LEFT JOIN tenants t ON o.customer_tenant_id = t.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 处理报价数据，解析JSON字段
    const processedQuotes = quotes.map(quote => {
      let senderInfo = {};
      let receiverInfo = {};

      try {
        senderInfo = typeof quote.sender_info === 'string' 
          ? JSON.parse(quote.sender_info) 
          : quote.sender_info || {};
      } catch (e) {
        console.warn('解析发货信息失败:', e);
      }

      try {
        receiverInfo = typeof quote.receiver_info === 'string' 
          ? JSON.parse(quote.receiver_info) 
          : quote.receiver_info || {};
      } catch (e) {
        console.warn('解析收货信息失败:', e);
      }

      return {
        id: quote.quote_id,
        order_id: quote.order_id,
        order_tracking_number: quote.tracking_number,
        customer_name: quote.customer_tenant_name || '未知客户',
        customer_contact_person: quote.customer_contact_person || '未知联系人',
        customer_contact_phone: quote.customer_contact_phone || '未知电话',
        quote_price: quote.quote_price,
        quote_delivery_time: quote.quote_delivery_time,
        quote_remarks: quote.quote_remarks,
        order_status: quote.order_status,
        order_created_at: quote.order_created_at,
        order_updated_at: quote.order_updated_at,
        sender_info: senderInfo,
        receiver_info: receiverInfo
      };
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          quotes: processedQuotes,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: totalItems,
            per_page: limit
          }
        }
      }
    };
  } catch (error) {
    console.error('获取承运商报价列表时出错:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取报价列表时发生错误'
      }
    };
  }
};