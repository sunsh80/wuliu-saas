/**
 * 获取车型详情API处理程序 (适配OpenAPI Backend)
 */

const { getDb } = require('../../../../db');

// 获取车型详情
async function getVehicleModel(c, req, res) {
  const id = c.request.params.id;

  const db = getDb();

  try {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM vehicle_models WHERE id = ?', [id], (err, vehicleModel) => {
        if (err) {
          console.error('查询车型详情失败:', err);
          resolve({
            statusCode: 500,
            body: {
              success: false,
              message: '查询车型详情失败',
              error: err.message
            }
          });
          return;
        }

        if (!vehicleModel) {
          resolve({
            statusCode: 404,
            body: {
              success: false,
              message: '车型不存在'
            }
          });
          return;
        }

        resolve({
          statusCode: 200,
          body: {
            success: true,
            message: '获取车型详情成功',
            data: vehicleModel
          }
        });
      });
    });
  } catch (error) {
    console.error('获取车型详情时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '获取车型详情时发生错误',
        error: error.message
      }
    };
  }
}

module.exports = getVehicleModel;