/**
 * 创建车型API处理程序
 */

const { getDb } = require('../../../../db');

// 创建车型
async function createVehicleModel(req, res) {
  const {
    brand,
    manufacturer,
    model_name,
    production_year,
    vehicle_type,
    battery_manufacturer,
    battery_model,
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

  // 验证必要字段
  if (!brand || !manufacturer || !model_name || !vehicle_type || !autonomous_level) {
    return res.status(400).json({
      success: false,
      message: '品牌、生产厂家、型号、车辆类型和自动驾驶级别为必填项'
    });
  }

  const db = getDb();

  // 检查车型是否已存在
  db.get(`
    SELECT id FROM vehicle_models
    WHERE brand = ? AND manufacturer = ? AND model_name = ? AND vehicle_type = ?
  `, [brand, manufacturer, model_name, vehicle_type], (err, existingModel) => {
    if (err) {
      console.error('检查车型是否已存在失败:', err);
      return res.status(500).json({
        success: false,
        message: '检查车型是否已存在失败',
        error: err.message
      });
    }

    if (existingModel) {
      return res.status(409).json({
        success: false,
        message: '该车型已存在'
      });
    }

    // 插入新车型
    const insertQuery = `
      INSERT INTO vehicle_models (
        brand, manufacturer, model_name, production_year, vehicle_type,
        battery_manufacturer, battery_model, autonomous_level,
        max_load_capacity, max_volume, fuel_type, engine_displacement,
        dimensions_length, dimensions_width, dimensions_height, wheelbase,
        max_speed, fuel_efficiency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [
      brand, manufacturer, model_name, production_year, vehicle_type,
      battery_manufacturer, battery_model, autonomous_level,
      max_load_capacity, max_volume, fuel_type, engine_displacement,
      dimensions_length, dimensions_width, dimensions_height, wheelbase,
      max_speed, fuel_efficiency
    ], function(err) {
      if (err) {
        console.error('插入新车型失败:', err);
        return res.status(500).json({
          success: false,
          message: '创建车型失败',
          error: err.message
        });
      }

      // 获取刚插入的车型信息
      db.get('SELECT * FROM vehicle_models WHERE id = ?', [this.lastID], (err, newVehicleModel) => {
        if (err) {
          console.error('查询新车型失败:', err);
          return res.status(500).json({
            success: false,
            message: '查询新车型失败',
            error: err.message
          });
        }

        res.status(201).json({
          success: true,
          message: '车型创建成功',
          data: newVehicleModel
        });
      });
    });
  });
}

module.exports = createVehicleModel;