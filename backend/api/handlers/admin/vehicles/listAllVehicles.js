// backend/api/handlers/admin/vehicles/listVehicles.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const db = getDb();

  try {
    // 获取所有车辆信息，关联租户信息
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
      ORDER BY tv.created_at DESC
    `);

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
    console.error('Error fetching vehicles:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while retrieving vehicles'
      }
    };
  }
};