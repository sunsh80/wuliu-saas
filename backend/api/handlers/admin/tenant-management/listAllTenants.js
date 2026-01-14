// api/handlers/admin/tenant-management/listAllTenants.js
// 注意：路径可能需要根据实际的文件夹结构调整，例如 api/handlers/tenant-management/ 或 api/handlers/admin/tenant-management/

const { getDb } = require('../../../../db/index.js'); // 假设数据库连接模块路径正确

module.exports = async (c) => { // 假设使用的是类似 Hono 的框架，c 是 context
  // 从查询参数获取分页、筛选和搜索信息
  const page = parseInt(c.req.query('page')) || 1;
  const limit = parseInt(c.req.query('limit')) || 10;
  const offset = (page - 1) * limit;
  const statusFilter = c.req.query('status'); // 'pending', 'approved', 'rejected', 'active', 'inactive' 等
  const searchQuery = c.req.query('search'); // 搜索项，可能用于 name 或 contact_person

  const database = getDb();

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
    const countResult = await database.get(
      `SELECT COUNT(*) as total FROM tenants ${whereClause}`,
      params
    );
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    // 获取分页后的租户列表
    const tenants = await database.all(
      `SELECT id, name, contact_person, contact_phone, email, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating FROM tenants ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 返回成功的 JSON 响应
    return c.json({
      success: true,
      data: {
        tenants,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tenants:', error);
    // 返回服务器错误响应
    return c.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving tenants'
    }, 500);
  }
};

// --- 如果使用的是 Express 框架，代码会略有不同 ---
/*
const { getDb } = require('../../../../db/index.js');

async function listAllTenants(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status;
  const searchQuery = req.query.search;

  const database = getDb();

  let whereClause = '';
  const params = [];

  if (statusFilter) {
    whereClause += 'WHERE status = ? ';
    params.push(statusFilter);
  }

  if (searchQuery) {
    const searchParam = `%${searchQuery}%`;
    if (whereClause) {
      whereClause += 'AND ';
    } else {
      whereClause = 'WHERE ';
    }
    whereClause += '(name LIKE ? OR contact_person LIKE ?) ';
    params.push(searchParam, searchParam);
  }

  try {
    const countResult = await database.get(
      `SELECT COUNT(*) as total FROM tenants ${whereClause}`,
      params
    );
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    const tenants = await database.all(
      `SELECT id, name, contact_person, contact_phone, email, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating FROM tenants ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        tenants,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving tenants'
    });
  }
}

module.exports = listAllTenants; // 导出函数供路由使用
*/