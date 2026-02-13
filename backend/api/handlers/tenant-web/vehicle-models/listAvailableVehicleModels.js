/**
 * 承运商可用车型库API处理程序
 */

const { getDb } = require('../../../../db');

// 获取可用车型库列表（供承运商选择）
async function listAvailableVehicleModels(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = getDb();

  // 构建查询条件
  let whereClause = 'WHERE 1=1';
  let params = [];

  if (req.query.brand) {
    whereClause += ' AND brand LIKE ?';
    params.push(`%${req.query.brand}%`);
  }

  if (req.query.manufacturer) {
    whereClause += ' AND manufacturer LIKE ?';
    params.push(`%${req.query.manufacturer}%`);
  }

  if (req.query.model_name) {
    whereClause += ' AND model_name LIKE ?';
    params.push(`%${req.query.model_name}%`);
  }

  if (req.query.vehicle_type) {
    whereClause += ' AND vehicle_type LIKE ?';
    params.push(`%${req.query.vehicle_type}%`);
  }

  if (req.query.autonomous_level) {
    whereClause += ' AND autonomous_level = ?';
    params.push(req.query.autonomous_level);
  }

  // 查询总数
  const countQuery = `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`;

  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error('查询车型总数失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询车型列表失败',
        error: err.message
      });
    }

    const total = countResult.total;

    // 查询数据
    const query = `
      SELECT * FROM vehicle_models
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [...params, limit, offset], (err, vehicleModels) => {
      if (err) {
        console.error('查询车型列表失败:', err);
        return res.status(500).json({
          success: false,
          message: '查询车型列表失败',
          error: err.message
        });
      }

      res.json({
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
      });
    });
  });
}

module.exports = listAvailableVehicleModels;