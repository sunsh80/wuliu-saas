/**
 * 承运商车辆API处理程序（与车型库集成）- 获取车辆列表
 */

const { getDb } = require('../../../../db');

// 获取承运商车辆列表
async function listTenantVehicles(req, res) {
  const tenantId = req.session.userId; // 从会话中获取当前用户ID
  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = getDb();

  // 构建查询条件
  let whereClause = 'WHERE tv.tenant_id = ?';
  let params = [tenantId];

  if (req.query.search) {
    whereClause += ' AND (tv.plate_number LIKE ? OR tv.type LIKE ? OR vm.brand LIKE ? OR vm.model_name LIKE ?)';
    const searchParam = `%${req.query.search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (req.query.status) {
    whereClause += ' AND tv.status = ?';
    params.push(req.query.status);
  }

  // 查询总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM tenant_vehicles tv
    LEFT JOIN vehicle_models vm ON tv.vehicle_model_id = vm.id
    ${whereClause}
  `;

  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error('查询车辆总数失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询车辆列表失败',
        error: err.message
      });
    }

    const total = countResult.total;

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

    db.all(query, [...params, limit, offset], (err, vehicles) => {
      if (err) {
        console.error('查询车辆列表失败:', err);
        return res.status(500).json({
          success: false,
          message: '查询车辆列表失败',
          error: err.message
        });
      }

      res.json({
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
      });
    });
  });
}

module.exports = listTenantVehicles;