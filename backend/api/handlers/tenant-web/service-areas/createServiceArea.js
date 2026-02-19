/**
 * 服务区域 API 处理程序 - 创建服务区域
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

  const { name, description, polygon_coordinates, center_lat, center_lng, radius_km } = c.request.body || {};

  // 验证必填字段
  if (!name) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '区域名称不能为空'
      }
    };
  }

  const db = await getDb();

  try {
    const result = await db.run(
      `
      INSERT INTO service_areas (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [
        tenantId,
        name,
        description || null,
        polygon_coordinates ? JSON.stringify(polygon_coordinates) : null,
        center_lat || null,
        center_lng || null,
        radius_km || null
      ]
    );

    return {
      statusCode: 201,
      body: {
        success: true,
        message: '服务区域创建成功',
        data: {
          id: result.lastID
        }
      }
    };
  } catch (error) {
    console.error('创建服务区域失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '创建服务区域失败',
        error: error.message
      }
    };
  }
};
