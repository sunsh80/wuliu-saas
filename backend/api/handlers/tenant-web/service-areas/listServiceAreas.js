/**
 * 服务区域 API 处理程序 - 获取服务区域列表
 */

const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const tenantId = c.session?.tenantId || c.context?.tenantId;
  if (!tenantId) {
    return {
      statusCode: 401,
      body: {
        success: false,
        message: '未授权访问'
      }
    };
  }

  const db = await getDb();

  try {
    const query = `
      SELECT
        id,
        tenant_id,
        name,
        description,
        polygon_coordinates,
        center_lat,
        center_lng,
        radius_km,
        status,
        created_at,
        updated_at
      FROM service_areas
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `;

    const areas = await db.all(query, [tenantId]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '获取服务区域列表成功',
        data: {
          areas: areas,
          total: areas.length
        }
      }
    };
  } catch (error) {
    console.error('查询服务区域列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '查询服务区域列表失败',
        error: error.message
      }
    };
  }
};
