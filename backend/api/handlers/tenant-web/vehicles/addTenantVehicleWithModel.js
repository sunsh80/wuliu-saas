/**
 * 承运商车辆 API 处理程序（与车型库集成）- 创建车辆
 */

const { getDb } = require('../../../../db');

// 创建承运商车辆（必须从车型库中选择）
module.exports = async (c) => {
  const tenantId = c.session?.tenantId || c.context?.tenantId;
  if (!tenantId) {
    return {
      statusCode: 401,
      body: {
        success: false,
        message: '未授权访问'
      }
    };
  }

  const db = getDb();

  const {
    vehicle_model_id,  // 必须从车型库中选择
    plate_number,
    status,
    driver_name,
    driver_phone
  } = c.request.body;

  // 验证必要字段
  if (!vehicle_model_id || !plate_number) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '车型 ID 和车牌号为必填项'
      }
    };
  }

  return new Promise((resolve) => {
    // 检查车型是否存在
    db.get('SELECT * FROM vehicle_models WHERE id = ?', [vehicle_model_id], (err, vehicleModel) => {
      if (err) {
        console.error('查询车型失败:', err);
        return resolve({
          statusCode: 500,
          body: {
            success: false,
            message: '查询车型失败',
            error: err.message
          }
        });
      }

      if (!vehicleModel) {
        return resolve({
          statusCode: 404,
          body: {
            success: false,
            message: '所选车型不存在'
          }
        });
      }

      // 检查车牌号是否已存在
      db.get('SELECT id FROM tenant_vehicles WHERE plate_number = ?', [plate_number], (err, existingPlate) => {
        if (err) {
          console.error('检查车牌号失败:', err);
          return resolve({
            statusCode: 500,
            body: {
              success: false,
              message: '检查车牌号失败',
              error: err.message
            }
          });
        }

        if (existingPlate) {
          return resolve({
            statusCode: 409,
            body: {
              success: false,
              message: '车牌号已存在'
            }
          });
        }

        // 从车型库获取车辆信息
        const {
          brand,
          manufacturer,
          model_name,
          vehicle_type,
          max_load_capacity,
          max_volume,
          dimensions_length,
          dimensions_width,
          dimensions_height
        } = vehicleModel;

        // 插入新车辆记录
        const insertQuery = `
          INSERT INTO tenant_vehicles (
            tenant_id, vehicle_model_id, plate_number, type, length, width, height,
            max_weight, volume, status, driver_name, driver_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [
          tenantId, vehicle_model_id, plate_number, vehicle_type,
          dimensions_length, dimensions_width, dimensions_height,
          max_load_capacity, max_volume, status || 'active', driver_name, driver_phone
        ], function(err) {
          if (err) {
            console.error('插入车辆失败:', err);
            return resolve({
              statusCode: 500,
              body: {
                success: false,
                message: '添加车辆失败',
                error: err.message
              }
            });
          }

          // 获取刚插入的车辆信息
          const newVehicleQuery = `
            SELECT
              tv.*,
              vm.brand,
              vm.model_name,
              vm.manufacturer,
              vm.vehicle_type as model_vehicle_type,
              vm.max_load_capacity,
              vm.max_volume as model_max_volume
            FROM tenant_vehicles tv
            LEFT JOIN vehicle_models vm ON tv.vehicle_model_id = vm.id
            WHERE tv.id = ?
          `;

          db.get(newVehicleQuery, [this.lastID], (err, newVehicle) => {
            if (err) {
              console.error('查询新车辆信息失败:', err);
              return resolve({
                statusCode: 500,
                body: {
                  success: false,
                  message: '查询新车辆信息失败',
                  error: err.message
                }
              });
            }

            resolve({
              statusCode: 201,
              body: {
                success: true,
                message: '车辆添加成功',
                data: newVehicle
              }
            });
          });
        });
      });
    });
  });
};
