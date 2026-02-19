/**
 * 承运商车辆 API 处理程序（与车型库集成）- 获取车辆详情
 */

const { getDb } = require('../../../../db');

// 获取车辆详情
module.exports = async (c) => {
  const vehicleId = c.request.params.id;
  const tenantId = c.session.userId;

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

  const query = `
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
    WHERE tv.id = ? AND tv.tenant_id = ?
  `;

  return new Promise((resolve) => {
    db.get(query, [vehicleId, tenantId], (err, vehicle) => {
      if (err) {
        console.error('查询车辆详情失败:', err);
        return resolve({
          statusCode: 500,
          body: {
            success: false,
            message: '查询车辆详情失败',
            error: err.message
          }
        });
      }

      if (!vehicle) {
        return resolve({
          statusCode: 404,
          body: {
            success: false,
            message: '车辆不存在或不属于当前承运商'
          }
        });
      }

      resolve({
        statusCode: 200,
        body: {
          success: true,
          message: '获取车辆详情成功',
          data: vehicle
        }
      });
    });
  });
};
