// backend/api/handlers/admin/tenant-management/listAllTenants.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  // 从查询参数获取分页、筛选和搜索信息
  const page = parseInt(c.request.query?.page) || 1;
  const limit = parseInt(c.request.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const statusFilter = c.request.query?.status; // 'pending', 'approved', 'rejected', 'active', 'inactive' 等
  const searchQuery = c.request.query?.search; // 搜索项，可能用于 name 或 contact_person

  const db = getDb();

  // 构建 SQL WHERE 子句和参数数组
  let whereClause = '';
  const params = [];

  if (statusFilter) {
    whereClause += 'WHERE status = ? ';
    params.push(statusFilter);
  }

  if (searchQuery) {
    const searchParam = `%${searchQuery}%`;
    if (whereClause) {
      whereClause += 'AND '; // 如果已有 WHERE，追加 AND
    } else {
      whereClause = 'WHERE '; // 否则从 WHERE 开始
    }
    // 搜索 name 或 contact_person 字段
    whereClause += '(name LIKE ? OR contact_person LIKE ?) ';
    params.push(searchParam, searchParam);
  }

  try {
    // 获取总数量用于分页计算
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM tenants ${whereClause}`,
      params
    );
    const totalItems = countResult?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // 获取分页后的租户列表
    const tenants = await db.all(
      `SELECT id, name, contact_person, contact_phone, email, roles, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating FROM tenants ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 返回成功的 JSON 响应
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tenants: tenants || [],
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
    console.error('Error fetching tenants:', error);
    // 返回服务器错误响应
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while retrieving tenants'
      }
    };
  }
};