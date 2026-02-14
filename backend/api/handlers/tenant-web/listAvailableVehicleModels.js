/**
 * 获取可用车型库列表处理器（供承运商选择）
 */
const db = require('../../../db');

module.exports = async (c) => {
  try {
    // 从查询参数获取分页选项
    const page = parseInt(c.request.query.page) || 1;
    const limit = parseInt(c.request.query.limit) || 10;

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询车型库总数
    const countQuery = 'SELECT COUNT(*) as total FROM vehicle_models';
    const countResult = await db.get(countQuery);
    const total = countResult.total;

    // 查询车型库列表
    const query = `
      SELECT * FROM vehicle_models
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const vehicleModels = await db.all(query, [limit, offset]);

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          vehicle_models: vehicleModels,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            items_per_page: limit,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      }
    };
  } catch (error) {
    console.error('获取可用车型库列表失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: '获取可用车型库列表失败',
        error: error.message
      }
    };
  }
};