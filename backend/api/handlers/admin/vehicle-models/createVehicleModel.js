/**
 * 创建车型API处理程序 (适配OpenAPI Backend)
 */

const { getDb } = require('../../../../db');

// 创建车型
async function createVehicleModel(c, req, res) {
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
  } = c.request.body;

  // 验证必要字段
  if (!brand || !manufacturer || !model_name || !vehicle_type || !autonomous_level) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '品牌、生产厂家、型号、车辆类型和自动驾驶级别为必填项'
      }
    };
  }

  const db = getDb();

  try {
    // 检查车型是否已存在
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM vehicle_models
        WHERE brand = ? AND manufacturer = ? AND model_name = ? AND vehicle_type = ?
      `, [brand, manufacturer, model_name, vehicle_type], (err, existingModel) => {
        if (err) {
          console.error('检查车型是否已存在失败:', err);
          resolve({
            statusCode: 500,
            body: {
              success: false,
              message: '检查车型是否已存在失败',
              error: err.message
            }
          });
          return;
        }

        if (existingModel) {
          resolve({
            statusCode: 409,
            body: {
              success: false,
              message: '该车型已存在'
            }
          });
          return;
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
            resolve({
              statusCode: 500,
              body: {
                success: false,
                message: '创建车型失败',
                error: err.message
              }
            });
            return;
          }

          // 获取刚插入的车型信息
          db.get('SELECT * FROM vehicle_models WHERE id = ?', [this.lastID], (err, newVehicleModel) => {
            if (err) {
              console.error('查询新车型失败:', err);
              resolve({
                statusCode: 500,
                body: {
                  success: false,
                  message: '查询新车型失败',
                  error: err.message
                }
              });
              return;
            }

            resolve({
              statusCode: 201,
              body: {
                success: true,
                message: '车型创建成功',
                data: newVehicleModel
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('创建车型时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '创建车型时发生错误',
        error: error.message
      }
    };
  }
}

module.exports = createVehicleModel;