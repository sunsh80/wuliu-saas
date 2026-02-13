/**
 * 更新车型API处理程序
 */

const { getDb } = require('../../../../db');

// 更新车型
async function updateVehicleModel(req, res) {
  const id = req.params.id;
  const updates = req.body;

  const db = getDb();

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
      return res.status(400).json({
        success: false,
        message: '没有提供有效的更新字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE vehicle_models SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, params, (err) => {
      if (err) {
        console.error('更新车型失败:', err);
        return res.status(500).json({
          success: false,
          message: '更新车型失败',
          error: err.message
        });
      }

      // 获取更新后的车型信息
      db.get('SELECT * FROM vehicle_models WHERE id = ?', [id], (err, updatedModel) => {
        if (err) {
          console.error('查询更新后的车型失败:', err);
          return res.status(500).json({
            success: false,
            message: '查询更新后的车型失败',
            error: err.message
          });
        }

        res.json({
          success: true,
          message: '车型更新成功',
          data: updatedModel
        });
      });
    });
  });
}

module.exports = updateVehicleModel;