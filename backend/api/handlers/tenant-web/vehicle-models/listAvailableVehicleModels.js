/**
 * 承运商可用车型库API处理程序
 */

const { getDb } = require('../../../../db');

// 获取可用车型库列表（供承运商选择）
async function listAvailableVehicleModels(req, res) {
  console.log('🔍 [DEBUG] listAvailableVehicleModels called with query params:', req.query);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = getDb();

  try {
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

    console.log('🔍 [DEBUG] SQL Query:', `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`);
    console.log('🔍 [DEBUG] Query Params:', params);

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

    const vehicleModels = await new Promise((resolve, reject) => {
      db.all(query, [...params, limit, offset], (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log('🔍 [DEBUG] Retrieved', results.length, 'vehicle models');
          
          // 检查是否有新石器车型
          const newStoneModels = results.filter(model => model.brand.includes('新石器'));
          if (newStoneModels.length > 0) {
            console.log('🔍 [DEBUG] Found 新石器 models in response:', newStoneModels.map(m => ({ id: m.id, brand: m.brand, model_name: m.model_name })));
          } else {
            console.log('🔍 [DEBUG] No 新石器 models in current filtered results');
          }
          
          resolve(results);
        }
      });
    });

    console.log('🔍 [DEBUG] Returning vehicle models:', vehicleModels.map(vm => ({ id: vm.id, brand: vm.brand, model_name: vm.model_name })));

    // 简化版本：不再额外查询总数，直接返回结果
    console.log('🔍 [DEBUG] Preparing response...');

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
  } catch (error) {
    console.error('🔍 [ERROR] Query vehicle models list failed:', error);
    res.status(500).json({
      success: false,
      message: '查询车型列表失败',
      error: error.message
    });
  }
}

module.exports = listAvailableVehicleModels;