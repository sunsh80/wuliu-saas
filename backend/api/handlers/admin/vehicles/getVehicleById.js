// backend/api/handlers/admin/vehicles\getVehicleById.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const vehicleId = c.request.param?.id;
  const db = getDb();

  if (!vehicleId) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'Vehicle ID is required'
      }
    };
  }

  try {
    // 获取特定车辆信息，关联租户信息
    const vehicle = await db.get(`
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
      WHERE tv.id = ?
    `, [vehicleId]);

    if (!vehicle) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          vehicle: vehicle
        }
      }
    };
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while retrieving vehicle'
      }
    };
  }
};