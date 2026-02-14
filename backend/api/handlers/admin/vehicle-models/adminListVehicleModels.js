/**
 * 获取车型库列表API处理程序 (适配OpenAPI Backend)
 * operationId: adminListVehicleModels
 */

const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();

    // 从查询参数获取分页和过滤参数
    const queryParams = c.request.query || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;
    const search = queryParams.search || '';
    const vehicleType = queryParams.vehicle_type || '';

    // 构建查询条件
    let whereClause = 'WHERE status != \'deleted\'';
    let params = [];

    if (search) {
      whereClause += ' AND (brand LIKE ? OR model_name LIKE ? OR manufacturer LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (vehicleType) {
      whereClause += ' AND vehicle_type LIKE ?';
      params.push(`%${vehicleType}%`);
    }

    // 查询总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`,
      params
    );
    const total = countResult.total;

    // 查询数据
    const query = `
      SELECT * FROM vehicle_models
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const vehicleModels = await db.all(query, [...params, limit, offset]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '车型列表获取成功',
        data: {
          vehicle_models: vehicleModels || [],
          pagination: {
            current_page: page,
            per_page: limit,
            total: total,
            total_pages: Math.ceil(total / limit),
            has_next: page < Math.ceil(total / limit),
            has_prev: page > 1
          }
        }
      }
    };
  } catch (error) {
    console.error('❌ adminListVehicleModels 失败:', error.message);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '查询车型列表失败',
        error: 'INTERNAL_ERROR'
      }
    };
  }
};