// backend/api/handlers/carrier/order/listCarrierOrders.js

const { getDb } = require('../../../../db/index.js');

/**
 * 承运商获取可报价的订单列表
 */
module.exports = async (c) => {
  // 🔴 关键日志 1：确认函数被调用
  console.log('🔍 [listCarrierOrders] Handler function called');
  console.log('   → Context roles:', c.context?.roles);
  console.log('   → Context tenantId:', c.context?.tenantId);
  console.log('   → Query params:', c.request.query);

  // 1. 权限校验
  console.log('🔍 [listCarrierOrders] Checking permissions...');
  console.log('   → Context available:', !!c.context);
  console.log('   → Context roles:', c.context?.roles);
  console.log('   → Has carrier role:', c.context?.roles?.includes('carrier'));

  if (!c.context || !c.context.roles) {
    console.warn('⚠️ [listCarrierOrders] Access denied: no context or roles available');
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'NO_CONTEXT',
        message: 'Authentication context not available.'
      }
    };
  }

  if (!c.context.roles.includes('carrier')) {
    console.warn('⚠️ [listCarrierOrders] Access denied: not a carrier role. Available roles:', c.context.roles);
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'NOT_A_CARRIER',
        message: `Access denied. Required role: 'carrier'. Available roles: ${c.context.roles.join(', ')}.`
      }
    };
  }

  const db = getDb();
  try {
    // 🔴 关键日志 2：即将执行查询
    console.log('🔍 [listCarrierOrders] Executing SQL query...');

    // 检查是否有查询参数，如果有则启用分页功能
    const queryParams = c.request.query;
    const hasPageParam = queryParams.page !== undefined;
    const hasLimitParam = queryParams.limit !== undefined;
    const hasStatusParam = queryParams.status !== undefined;
    const hasSearchParam = queryParams.search !== undefined;

    let orders;
    if (hasPageParam || hasLimitParam || hasStatusParam || hasSearchParam) {
      // 使用分页查询
      console.log('🔍 [listCarrierOrders] Using paginated query');
      
      // 获取分页参数并验证
      let page = parseInt(queryParams.page) || 1;
      let limit = Math.min(parseInt(queryParams.limit) || 10, 100); // 限制最大每页数量为100
      const offset = (page - 1) * limit;

      // 获取筛选参数
      const status = queryParams.status || null;
      const search = queryParams.search || null;

      console.log('   → Page:', page, 'Limit:', limit, 'Offset:', offset);
      console.log('   → Status filter:', status, 'Search term:', search);

      // 构建查询条件
      let whereClause = "WHERE status IN ('pending_claim', 'claimed', 'quoted')";
      const params = [];

      if (status) {
        whereClause += " AND status = ?";
        params.push(status);
      }

      if (search) {
        whereClause += " AND (tracking_number LIKE ? OR customer_phone LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      // 首先获取总数用于分页计算
      const countResult = await db.get(`SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
      const total = countResult ? countResult.total || 0 : 0;
      const totalPages = Math.ceil(total / limit);

      // 执行分页查询
      const paginatedOrders = await db.all(`
        SELECT
          id,
          tracking_number,
          sender_info,
          receiver_info,
          weight_kg,
          volume_m3,
          status,
          created_at,
          updated_at,
          customer_tenant_id,
          customer_phone,
          description,
          cargo_type
        FROM orders
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // 🔴 关键日志 3：查询完成
      console.log('✅ [listCarrierOrders] Paginated query completed. Found', paginatedOrders.length, 'orders out of total', total);

      // 3. 格式化
      const formattedOrders = paginatedOrders.map(order => {
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
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_tenant_id: order.customer_tenant_id,
          customer_phone: order.customer_phone,
          description: order.description,
          cargo_type: order.cargo_type
        };
      });

      // 🔴 关键日志 4：准备返回
      console.log('📤 [listCarrierOrders] Returning paginated response with', formattedOrders.length, 'orders');

      return {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orders: formattedOrders,
            pagination: {
              current_page: page,
              total_pages: totalPages,
              total_items: total,
              per_page: limit
            }
          }
        }
      };
    } else {
      // 使用原始查询（无分页）
      console.log('🔍 [listCarrierOrders] Using original query (no pagination)');
      
      orders = await db.all(`
        SELECT
          id,
          tracking_number,
          sender_info,
          receiver_info,
          weight_kg,
          volume_m3,
          status,
          created_at,
          updated_at,
          customer_tenant_id,
          customer_phone,
          description,
          cargo_type
        FROM orders
        WHERE status IN ('pending_claim', 'claimed', 'quoted')
        ORDER BY created_at DESC
        LIMIT 50
      `);

      // 🔴 关键日志 3：查询完成
      console.log('✅ [listCarrierOrders] Original query completed. Found', orders.length, 'orders');

      // 3. 格式化
      const formattedOrders = orders.map(order => {
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
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_tenant_id: order.customer_tenant_id,
          customer_phone: order.customer_phone,
          description: order.description,
          cargo_type: order.cargo_type
        };
      });

      // 🔴 关键日志 4：准备返回
      console.log('📤 [listCarrierOrders] Returning response with', formattedOrders.length, 'orders');

      return {
        statusCode: 200,
        body: {
          success: true,
          data: { orders: formattedOrders }
        }
      };
    }

  } catch (error) {
    console.error('❌ [listCarrierOrders] Database error:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch orders.'
      }
    };
  }
};