/**
 * 承运商车辆 API 处理程序（与车型库集成）- 获取车辆列表
 */

const { getDb } = require('../../../../db');

// 获取承运商车辆列表
module.exports = async (c) => {
  const tenantId = c.session?.tenantId || c.context?.tenantId; // 从会话中获取当前用户 ID
  if (!tenantId) {
    return {
      statusCode: 401,
      body: {
        success: false,
        message: '未授权访问'
      }
    };
  }

  const page = parseInt(c.request.query.page) || 1;
  const limit = parseInt(c.request.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = await getDb();

  // 构建查询条件
  let whereClause = 'WHERE tv.tenant_id = ?';
  let params = [tenantId];

  if (c.request.query.search) {
    whereClause += ' AND (tv.plate_number LIKE ? OR tv.type LIKE ? OR vm.brand LIKE ? OR vm.model_name LIKE ?)';
    const searchParam = `%${c.request.query.search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (c.request.query.status) {
    whereClause += ' AND tv.status = ?';
    params.push(c.request.query.status);
  }

  try {
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tenant_vehicles tv
      LEFT JOIN vehicle_models vm ON tv.vehicle_model_id = vm.id
      ${whereClause}
    `;

    const countResult = await db.get(countQuery, params);
    const total = countResult?.total || 0;

    // 查询数据
    const query = `
      SELECT
        tv.id,
        tv.tenant_id,
        tv.vehicle_model_id,
        tv.plate_number,
        tv.type,
        tv.length,
        tv.width,
        tv.height,
        tv.max_weight,
        tv.volume,
        tv.status,
        tv.driver_name,
        tv.driver_phone,
        tv.image_url,
        tv.created_at,
        tv.updated_at,
        vm.brand,
        vm.model_name,
        vm.manufacturer,
        vm.vehicle_type as model_vehicle_type,
        vm.max_load_capacity,
        vm.max_volume as model_max_volume
      FROM tenant_vehicles tv
      LEFT JOIN vehicle_models vm ON tv.vehicle_model_id = vm.id
      ${whereClause}
      ORDER BY tv.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const vehicles = await db.all(query, [...params, limit, offset]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '获取车辆列表成功',
        data: {
          vehicles: vehicles,
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
    console.error('查询车辆列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '查询车辆列表失败',
        error: error.message
      }
    };
  }
};
