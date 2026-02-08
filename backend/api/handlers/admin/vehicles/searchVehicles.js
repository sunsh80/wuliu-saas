// backend/api/handlers/admin/vehicles/searchVehicles.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { plate_number, tenant_name } = c.request.query;
  const db = getDb();

  // 构建查询条件
  let whereClause = '';
  const params = [];

  if (plate_number) {
    whereClause += 'tv.plate_number LIKE ?';
    params.push(`%${plate_number}%`);
  }

  if (tenant_name) {
    if (whereClause) {
      whereClause += ' AND ';
    }
    whereClause += 't.name LIKE ?';
    params.push(`%${tenant_name}%`);
  }

  if (whereClause) {
    whereClause = 'WHERE ' + whereClause;
  }

  try {
    // 搜索车辆信息，关联租户信息
    const vehicles = await db.all(`
      SELECT 
        tv.id,
        tv.tenant_id,
        t.name as tenant_name,
        tv.plate_number,
        tv.type,
        tv.length,
        tv.width,
        tv.height,
        tv.max_weight,
        tv.volume,
        tv.status,
        tv.driver_name,
        tv.driver_phone,
        tv.image_url,
        tv.created_at,
        tv.updated_at
      FROM tenant_vehicles tv
      LEFT JOIN tenants t ON tv.tenant_id = t.id
      ${whereClause}
      ORDER BY tv.created_at DESC
    `, params);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          vehicles: vehicles || []
        }
      }
    };
  } catch (error) {
    console.error('Error searching vehicles:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while searching vehicles'
      }
    };
  }
};