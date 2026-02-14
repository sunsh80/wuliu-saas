/**
 * 删除车型API处理程序 (适配OpenAPI Backend)
 */

const { getDatabaseManager } = require('../../../../db');

// 删除车型
async function deleteVehicleModel(c, req, res) {
  const id = c.request.params.id;

  try {
    // 获取数据库连接
    const { getDb } = require('../../../../db');
    const db = getDb();

    // 检查车型是否存在
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM vehicle_models WHERE id = ?', [id], (err, existingModel) => {
        if (err) {
          console.error('查询车型是否存在失败:', err);
          resolve({
            statusCode: 500,
            body: {
              success: false,
              message: '查询车型是否存在失败',
              error: err.message
            }
          });
          return;
        }

        if (!existingModel) {
          resolve({
            statusCode: 404,
            body: {
              success: false,
              message: '车型不存在'
            }
          });
          return;
        }

        // 检查是否有车辆正在使用此车型
        db.get('SELECT id FROM tenant_vehicles WHERE vehicle_model_id = ?', [id], (err, vehicleUsingModel) => {
          if (err) {
            console.error('检查车型是否被使用失败:', err);
            resolve({
              statusCode: 500,
              body: {
                success: false,
                message: '检查车型是否被使用失败',
                error: err.message
              }
            });
            return;
          }

          if (vehicleUsingModel) {
            resolve({
              statusCode: 409,
              body: {
                success: false,
                message: '车型正在被使用，无法删除'
              }
            });
            return;
          }

          // 删除车型
          db.run('DELETE FROM vehicle_models WHERE id = ?', [id], (err) => {
            if (err) {
              console.error('删除车型失败:', err);
              resolve({
                statusCode: 500,
                body: {
                  success: false,
                  message: '删除车型失败',
                  error: err.message
                }
              });
              return;
            }

            resolve({
              statusCode: 200,
              body: {
                success: true,
                message: '车型删除成功'
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('删除车型时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '删除车型时发生错误',
        error: error.message
      }
    };
  }
}

module.exports = deleteVehicleModel;