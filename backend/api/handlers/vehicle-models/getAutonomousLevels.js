/**
 * 获取自动驾驶级别列表处理器
 */
const db = require('../../../db');

module.exports = async (c) => {
  try {
    const levels = await db.all(`
      SELECT DISTINCT autonomous_level
      FROM vehicle_models
      WHERE autonomous_level IS NOT NULL
      ORDER BY autonomous_level ASC
    `);

    return {
      status: 200,
      body: {
        success: true,
        message: '获取自动驾驶级别成功',
        data: {
          autonomous_levels: levels.map(level => ({ value: level.autonomous_level }))
        }
      }
    };
  } catch (error) {
    console.error('获取自动驾驶级别失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: '获取自动驾驶级别失败',
        error: error.message
      }
    };
  }
};