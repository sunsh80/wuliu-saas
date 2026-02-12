/**
 * 车型库API处理器
 * 提供车型库的增删改查功能
 */

const fs = require('fs').promises;
const path = require('path');

// 获取车型库列表
async function listVehicleModels(req, res) {
  try {
    const db = req.app.get('db');
    
    // 解析查询参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const brand = req.query.brand || '';
    const model = req.query.model || '';
    const vehicleType = req.query.vehicle_type || '';
    const autonomousLevel = req.query.autonomous_level || '';

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (brand) {
      whereClause += ' AND brand LIKE ?';
      params.push(`%${brand}%`);
    }
    
    if (model) {
      whereClause += ' AND model_name LIKE ?';
      params.push(`%${model}%`);
    }
    
    if (vehicleType) {
      whereClause += ' AND vehicle_type LIKE ?';
      params.push(`%${vehicleType}%`);
    }
    
    if (autonomousLevel) {
      whereClause += ' AND autonomous_level = ?';
      params.push(autonomousLevel);
    }

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM vehicle_models ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    const total = countResult.total;

    // 查询数据
    const query = `
      SELECT * FROM vehicle_models
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const vehicles = await db.all(query, [...params, limit, offset]);

    res.json({
      success: true,
      message: '获取车型库列表成功',
      data: {
        vehicles,
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
    console.error('获取车型库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车型库列表失败',
      error: error.message
    });
  }
}

// 获取车型详情
async function getVehicleModel(req, res) {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    const vehicle = await db.get(
      'SELECT * FROM vehicle_models WHERE id = ?', 
      [id]
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: '车型不存在'
      });
    }

    res.json({
      success: true,
      message: '获取车型详情成功',
      data: vehicle
    });
  } catch (error) {
    console.error('获取车型详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车型详情失败',
      error: error.message
    });
  }
}

// 创建车型
async function createVehicleModel(req, res) {
  try {
    const db = req.app.get('db');
    const {
      brand,
      manufacturer,
      model_name,
      production_year,
      vehicle_type,
      autonomous_level,
      max_load_capacity,
      max_volume,
      fuel_type,
      engine_displacement,
      dimensions_length,
      dimensions_width,
      dimensions_height,
      wheelbase,
      max_speed,
      fuel_efficiency
    } = req.body;

    // 验证必填字段
    if (!brand || !manufacturer || !model_name || !vehicle_type) {
      return res.status(400).json({
        success: false,
        message: '品牌、生产厂家、车型名称和车辆类型为必填项'
      });
    }

    // 检查车型是否已存在
    const existingModel = await db.get(
      'SELECT id FROM vehicle_models WHERE brand = ? AND model_name = ? AND manufacturer = ?',
      [brand, model_name, manufacturer]
    );

    if (existingModel) {
      return res.status(409).json({
        success: false,
        message: '该车型已存在于车型库中'
      });
    }

    // 插入新车型
    const result = await db.run(`
      INSERT INTO vehicle_models (
        brand, manufacturer, model_name, production_year, vehicle_type, 
        autonomous_level, max_load_capacity, max_volume, fuel_type, 
        engine_displacement, dimensions_length, dimensions_width, 
        dimensions_height, wheelbase, max_speed, fuel_efficiency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      brand, manufacturer, model_name, production_year, vehicle_type,
      autonomous_level, max_load_capacity, max_volume, fuel_type,
      engine_displacement, dimensions_length, dimensions_width,
      dimensions_height, wheelbase, max_speed, fuel_efficiency
    ]);

    const newVehicle = await db.get(
      'SELECT * FROM vehicle_models WHERE id = ?', 
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: '车型创建成功',
      data: newVehicle
    });
  } catch (error) {
    console.error('创建车型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建车型失败',
      error: error.message
    });
  }
}

// 更新车型
async function updateVehicleModel(req, res) {
  try {
    const db = req.app.get('db');
    const { id } = req.params;
    const updates = req.body;

    // 检查车型是否存在
    const existingVehicle = await db.get(
      'SELECT * FROM vehicle_models WHERE id = ?', 
      [id]
    );

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: '车型不存在'
      });
    }

    // 构建更新语句
    const updateFields = [];
    const params = [];
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });
    
    params.push(id);

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供有效的更新字段'
      });
    }

    const query = `UPDATE vehicle_models SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await db.run(query, params);

    const updatedVehicle = await db.get(
      'SELECT * FROM vehicle_models WHERE id = ?', 
      [id]
    );

    res.json({
      success: true,
      message: '车型更新成功',
      data: updatedVehicle
    });
  } catch (error) {
    console.error('更新车型失败:', error);
    res.status(500).json({
      success: false,
      message: '更新车型失败',
      error: error.message
    });
  }
}

// 删除车型
async function deleteVehicleModel(req, res) {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    // 检查车型是否存在
    const vehicle = await db.get(
      'SELECT * FROM vehicle_models WHERE id = ?', 
      [id]
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: '车型不存在'
      });
    }

    // 检查是否有承运商正在使用此车型
    const vehicleInUse = await db.get(
      'SELECT id FROM vehicles WHERE model_id = ?', 
      [id]
    );

    if (vehicleInUse) {
      return res.status(409).json({
        success: false,
        message: '该车型已被承运商使用，无法删除'
      });
    }

    // 删除车型
    await db.run('DELETE FROM vehicle_models WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '车型删除成功'
    });
  } catch (error) {
    console.error('删除车型失败:', error);
    res.status(500).json({
      success: false,
      message: '删除车型失败',
      error: error.message
    });
  }
}

// 获取车型类型列表
async function getVehicleTypes(req, res) {
  try {
    const db = req.app.get('db');

    const types = await db.all(`
      SELECT DISTINCT vehicle_type 
      FROM vehicle_models 
      WHERE vehicle_type IS NOT NULL 
      ORDER BY vehicle_type ASC
    `);

    res.json({
      success: true,
      message: '获取车型类型成功',
      data: types.map(type => ({ value: type.vehicle_type }))
    });
  } catch (error) {
    console.error('获取车型类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车型类型失败',
      error: error.message
    });
  }
}

// 获取自动驾驶级别列表
async function getAutonomousLevels(req, res) {
  try {
    const db = req.app.get('db');

    const levels = await db.all(`
      SELECT DISTINCT autonomous_level 
      FROM vehicle_models 
      WHERE autonomous_level IS NOT NULL 
      ORDER BY autonomous_level ASC
    `);

    res.json({
      success: true,
      message: '获取自动驾驶级别成功',
      data: levels.map(level => ({ value: level.autonomous_level }))
    });
  } catch (error) {
    console.error('获取自动驾驶级别失败:', error);
    res.status(500).json({
      success: false,
      message: '获取自动驾驶级别失败',
      error: error.message
    });
  }
}

module.exports = {
  listVehicleModels,
  getVehicleModel,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  getVehicleTypes,
  getAutonomousLevels
};