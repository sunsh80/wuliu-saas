/**
 * 更新车型API处理程序 (适配OpenAPI Backend)
 */

const { getDb } = require('../../../../db');

// 更新车型
async function updateVehicleModel(c, req, res) {
  const id = c.request.params.id;
  const updates = c.request.body;

  const db = getDb();

  try {
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

        // 构建更新语句
        const updateFields = [];
        const params = [];

        Object.keys(updates).forEach(key => {
          if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
            updateFields.push(`${key} = ?`);
            params.push(updates[key]);
          }
        });

        if (updateFields.length === 0) {
          resolve({
            statusCode: 400,
            body: {
              success: false,
              message: '没有提供有效的更新字段'
            }
          });
          return;
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const query = `UPDATE vehicle_models SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(query, params, (err) => {
          if (err) {
            console.error('更新车型失败:', err);
            resolve({
              statusCode: 500,
              body: {
                success: false,
                message: '更新车型失败',
                error: err.message
              }
            });
            return;
          }

          // 获取更新后的车型信息
          db.get('SELECT * FROM vehicle_models WHERE id = ?', [id], (err, updatedModel) => {
            if (err) {
              console.error('查询更新后的车型失败:', err);
              resolve({
                statusCode: 500,
                body: {
                  success: false,
                  message: '查询更新后的车型失败',
                  error: err.message
                }
              });
              return;
            }

            resolve({
              statusCode: 200,
              body: {
                success: true,
                message: '车型更新成功',
                data: updatedModel
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('更新车型时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '更新车型时发生错误',
        error: error.message
      }
    };
  }
}

module.exports = updateVehicleModel;