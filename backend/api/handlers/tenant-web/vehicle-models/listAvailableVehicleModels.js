/**
 * 承运商可用车型库 API 处理程序
 */

const { getDb } = require('../../../../db');

// 获取可用车型库列表（供承运商选择）
module.exports = async (c) => {
  console.log('🔍 [DEBUG] listAvailableVehicleModels called with query params:', c.request.query);

  const page = parseInt(c.request.query.page) || 1;
  const limit = parseInt(c.request.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = getDb();

  try {
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (c.request.query.brand) {
      whereClause += ' AND brand LIKE ?';
      params.push(`%${c.request.query.brand}%`);
    }

    if (c.request.query.manufacturer) {
      whereClause += ' AND manufacturer LIKE ?';
      params.push(`%${c.request.query.manufacturer}%`);
    }

    if (c.request.query.model_name) {
      whereClause += ' AND model_name LIKE ?';
      params.push(`%${c.request.query.model_name}%`);
    }

    if (c.request.query.vehicle_type) {
      whereClause += ' AND vehicle_type LIKE ?';
      params.push(`%${c.request.query.vehicle_type}%`);
    }

    if (c.request.query.autonomous_level) {
      whereClause += ' AND autonomous_level = ?';
      params.push(c.request.query.autonomous_level);
    }

    console.log('🔍 [DEBUG] SQL Query:', `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`);
    console.log('🔍 [DEBUG] Query Params:', params);

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`;

    console.log('🔍 [DEBUG] Executing count query...');
    const countResult = await db.get(countQuery, params);
    const total = countResult?.total || 0;
    console.log('🔍 [DEBUG] Filtered vehicle models count:', total);

    // 查询数据
    const query = `
      SELECT * FROM vehicle_models
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 [DEBUG] Data query:', query);
    console.log('🔍 [DEBUG] Data query params:', [...params, limit, offset]);

    const vehicleModels = await db.all(query, [...params, limit, offset]);

    console.log('🔍 [DEBUG] Returning vehicle models:', vehicleModels.map(vm => ({ id: vm.id, brand: vm.brand, model_name: vm.model_name })));

    // 简化版本：不再额外查询总数，直接返回结果
    console.log('🔍 [DEBUG] Preparing response...');

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '获取可用车型库列表成功',
        data: {
          vehicle_models: vehicleModels,
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
    console.error('🔍 [ERROR] Query vehicle models list failed:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '查询车型列表失败',
        error: error.message
      }
    };
  }
};
