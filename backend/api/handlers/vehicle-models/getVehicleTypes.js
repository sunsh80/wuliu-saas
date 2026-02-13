/**
 * 车型库API处理程序 - 获取车型类型列表
 */

const { getDb } = require('../../../db');

// 获取车型类型列表
function getVehicleTypes(req, res) {
  const db = getDb();

  db.all(`
    SELECT DISTINCT vehicle_type
    FROM vehicle_models
    WHERE vehicle_type IS NOT NULL
    ORDER BY vehicle_type ASC
  `, (err, types) => {
    if (err) {
      console.error('查询车型类型失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询车型类型失败',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: '获取车型类型成功',
      data: types.map(type => ({ value: type.vehicle_type }))
    });
  });
}

module.exports = getVehicleTypes;