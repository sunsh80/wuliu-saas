/**
 * 承运商车辆 API 处理程序（与车型库集成）- 删除车辆
 */

const { getDb } = require('../../../../db');

// 删除车辆
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

  return new Promise((resolve) => {
    // 检查车辆是否存在且属于当前承运商
    db.get('SELECT * FROM tenant_vehicles WHERE id = ? AND tenant_id = ?', [vehicleId, tenantId], (err, existingVehicle) => {
      if (err) {
        console.error('查询车辆信息失败:', err);
        return resolve({
          statusCode: 500,
          body: {
            success: false,
            message: '查询车辆信息失败',
            error: err.message
          }
        });
      }

      if (!existingVehicle) {
        return resolve({
          statusCode: 404,
          body: {
            success: false,
            message: '车辆不存在或不属于当前承运商'
          }
        });
      }

      // 删除车辆
      db.run('DELETE FROM tenant_vehicles WHERE id = ? AND tenant_id = ?', [vehicleId, tenantId], (err) => {
        if (err) {
          console.error('删除车辆失败:', err);
          return resolve({
            statusCode: 500,
            body: {
              success: false,
              message: '删除车辆失败',
              error: err.message
            }
          });
        }

        resolve({
          statusCode: 200,
          body: {
            success: true,
            message: '车辆删除成功'
          }
        });
      });
    });
  });
};
