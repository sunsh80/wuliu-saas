/**
 * 获取车型类型列表处理器
 */
const db = require('../../../db');

module.exports = async (c) => {
  try {
    const types = await db.all(`
      SELECT DISTINCT vehicle_type
      FROM vehicle_models
      WHERE vehicle_type IS NOT NULL
      ORDER BY vehicle_type ASC
    `);

    return {
      status: 200,
      body: {
        success: true,
        message: '获取车型类型成功',
        data: {
          vehicle_types: types.map(type => ({ value: type.vehicle_type }))
        }
      }
    };
  } catch (error) {
    console.error('获取车型类型失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: '获取车型类型失败',
        error: error.message
      }
    };
  }
};