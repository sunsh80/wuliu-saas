// backend/api/handlers/admin/risk-control/getViolationRecords.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 风控违规记录查询处理器启动 ---");
  
  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.warn("⚠️ Unauthorized: Admin role required");
    return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '需要管理员权限' } };
  }

  const db = getDb();
  
  try {
    // 获取查询参数
    const queryParams = c.request.query;
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const violationType = queryParams.violation_type || null; // 'carrier_cancel_before_choice', 'carrier_cancel_after_choice', 'customer_cancel', 'late_delivery'
    const status = queryParams.status || null; // 'pending', 'processed', 'appealed'
    const startDate = queryParams.start_date || null;
    const endDate = queryParams.end_date || null;
    const targetId = queryParams.target_id || null; // 承运商ID或客户ID

    // 构建查询条件
    let whereClause = "WHERE 1=1";
    const params = [];

    if (violationType) {
      whereClause += " AND vr.violation_type = ?";
      params.push(violationType);
    }

    if (status) {
      whereClause += " AND vr.status = ?";
      params.push(status);
    }

    if (startDate) {
      whereClause += " AND vr.created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND vr.created_at <= ?";
      params.push(endDate);
    }

    if (targetId) {
      whereClause += " AND vr.target_id = ?";
      params.push(targetId);
    }

    // 查询违规记录总数
    const countResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM violation_records vr
      JOIN orders o ON vr.order_id = o.id
      ${whereClause}
    `, params);

    const total = countResult.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 查询违规记录详情
    const records = await db.all(`
      SELECT 
        vr.id,
        vr.order_id,
        vr.violation_type,
        vr.target_type, -- 'carrier' or 'customer'
        vr.target_id,   -- 承运商或客户的ID
        vr.description,
        vr.penalty_points,
        vr.status,
        vr.evidence,
        vr.appeal_reason,
        vr.processed_by,
        vr.processed_at,
        vr.created_at,
        o.tracking_number,
        o.status as order_status,
        -- 获取目标用户信息
        CASE 
          WHEN vr.target_type = 'carrier' THEN t.name
          WHEN vr.target_type = 'customer' THEN ct.name
        END as target_name,
        -- 获取订单相关信息
        o.pickup_address,
        o.delivery_address,
        o.weight_kg
      FROM violation_records vr
      JOIN orders o ON vr.order_id = o.id
      LEFT JOIN tenants t ON (vr.target_type = 'carrier' AND vr.target_id = t.id)
      LEFT JOIN tenants ct ON (vr.target_type = 'customer' AND vr.target_id = ct.id)
      ${whereClause}
      ORDER BY vr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      status: 200,
      body: {
        success: true,
        message: '获取违规记录成功',
        data: {
          records: records,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            per_page: limit
          }
        }
      }
    };

  } catch (error) {
    console.error('💥 [VIOLATION RECORDS QUERY ERROR]:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误'
      }
    };
  }
};