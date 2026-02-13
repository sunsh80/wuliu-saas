/**
 * 删除车型API处理程序
 */

const { getDatabaseManager } = require('../../../../db');

// 删除车型
async function deleteVehicleModel(req, res) {
  const id = req.params.id;

  try {
    // 获取数据库连接
    const dbManager = getDatabaseManager();
    const db = dbManager.getDb();

    // 检查车型是否存在
    db.get('SELECT id FROM vehicle_models WHERE id = ?', [id], (err, existingModel) => {
      if (err) {
        console.error('查询车型是否存在失败:', err);
        return res.status(500).json({
          success: false,
          message: '查询车型是否存在失败',
          error: err.message
        });
      }

      if (!existingModel) {
        return res.status(404).json({
          success: false,
          message: '车型不存在'
        });
      }

      // 检查是否有车辆正在使用此车型
      db.get('SELECT id FROM tenant_vehicles WHERE vehicle_model_id = ?', [id], (err, vehicleUsingModel) => {
        if (err) {
          console.error('检查车型是否被使用失败:', err);
          return res.status(500).json({
            success: false,
            message: '检查车型是否被使用失败',
            error: err.message
          });
        }

        if (vehicleUsingModel) {
          return res.status(409).json({
            success: false,
            message: '车型正在被使用，无法删除'
          });
        }

        // 删除车型
        db.run('DELETE FROM vehicle_models WHERE id = ?', [id], (err) => {
          if (err) {
            console.error('删除车型失败:', err);
            return res.status(500).json({
              success: false,
              message: '删除车型失败',
              error: err.message
            });
          }

          res.json({
            success: true,
            message: '车型删除成功'
          });
        });
      });
    });
  } catch (error) {
    console.error('获取数据库连接失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取数据库连接失败',
      error: error.message
    });
  }
}

module.exports = deleteVehicleModel;