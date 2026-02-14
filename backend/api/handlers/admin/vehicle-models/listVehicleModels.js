/**
 * 获取车型库列表API处理程序 (适配OpenAPI Backend)
 */

const { getDb } = require('../../../../db');

// 获取车型库列表
async function listVehicleModels(c, req, res) {
  try {
    // OpenAPI Backend的上下文对象结构
    // c.request.query 包含查询参数
    const queryParams = c.request.query || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    const db = getDb();

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (queryParams.brand) {
      whereClause += ' AND brand LIKE ?';
      params.push(`%${queryParams.brand}%`);
    }

    if (queryParams.manufacturer) {
      whereClause += ' AND manufacturer LIKE ?';
      params.push(`%${queryParams.manufacturer}%`);
    }

    if (queryParams.model_name) {
      whereClause += ' AND model_name LIKE ?';
      params.push(`%${queryParams.model_name}%`);
    }

    if (queryParams.vehicle_type) {
      whereClause += ' AND vehicle_type LIKE ?';
      params.push(`%${queryParams.vehicle_type}%`);
    }

    if (queryParams.autonomous_level) {
      whereClause += ' AND autonomous_level = ?';
      params.push(queryParams.autonomous_level);
    }

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`;

    const countResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const total = countResult.total;

    // 查询数据
    const query = `
      SELECT * FROM vehicle_models
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const vehicleModels = await new Promise((resolve, reject) => {
      db.all(query, [...params, limit, offset], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '获取车型库列表成功',
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
    console.error('查询车型列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '查询车型列表失败',
        error: error.message
      }
    };
  }
}

module.exports = listVehicleModels;