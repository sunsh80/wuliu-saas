/**
 * 获取车型详情API处理程序
 */

const { getDb } = require('../../../../db');

// 获取车型详情
async function getVehicleModel(req, res) {
  const id = req.params.id;

  const db = getDb();

  db.get('SELECT * FROM vehicle_models WHERE id = ?', [id], (err, vehicleModel) => {
    if (err) {
      console.error('查询车型详情失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询车型详情失败',
        error: err.message
      });
    }

    if (!vehicleModel) {
      return res.status(404).json({
        success: false,
        message: '车型不存在'
      });
    }

    res.json({
      success: true,
      message: '获取车型详情成功',
      data: vehicleModel
    });
  });
}

module.exports = getVehicleModel;