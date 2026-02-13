/**
 * 车型库API处理程序 - 获取自动驾驶级别列表
 */

const { getDb } = require('../../../db');

// 获取自动驾驶级别列表
function getAutonomousLevels(req, res) {
  const db = getDb();

  db.all(`
    SELECT DISTINCT autonomous_level
    FROM vehicle_models
    WHERE autonomous_level IS NOT NULL
    ORDER BY autonomous_level ASC
  `, (err, levels) => {
    if (err) {
      console.error('查询自动驾驶级别失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询自动驾驶级别失败',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: '获取自动驾驶级别成功',
      data: levels.map(level => ({ value: level.autonomous_level }))
    });
  });
}

module.exports = getAutonomousLevels;