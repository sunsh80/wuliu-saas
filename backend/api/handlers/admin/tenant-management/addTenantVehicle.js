// api/handlers/tenant-management/updateTenantVehicles.js
const { getDb } = require('../../../../db/index.js');

// This is just an example for adding a vehicle. You'd need separate handlers for updating/deleting.
module.exports = async (c) => {
    const tenantId = c.request.params.id;
    const { plate_number, type, length, width, height, max_weight, volume, status, driver_name, driver_phone, image_url } = c.request.body;
    const database = getDb();

    // Basic validation
    if (!plate_number || !type) {
         return {
            status: 400,
            body: {
                success: false,
                error: 'MISSING_REQUIRED_FIELDS',
                message: 'Plate number and type are required.'
            }
        };
    }

    // Check if tenant exists
    const tenantExists = await database.get(
        `SELECT id FROM tenants WHERE id = ?`,
        [tenantId]
    );

    if (!tenantExists) {
        return {
            status: 404,
            body: {
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant not found'
            }
        };
    }

    // Insert new vehicle
    const result = await database.run(
        `INSERT INTO tenant_vehicles (tenant_id, plate_number, type, length, width, height, max_weight, volume, status, driver_name, driver_phone, image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [tenantId, plate_number, type, length, width, height, max_weight, volume, status, driver_name, driver_phone, image_url]
    );

    // Return the newly added vehicle
    const newVehicle = await database.get(
        `SELECT id, plate_number, type, length, width, height, max_weight, volume, status, driver_name, driver_phone, image_url, created_at, updated_at
         FROM tenant_vehicles
         WHERE id = ?`,
        [result.lastID]
    );

    return {
        status: 201, // Created
        body: {
            success: true,
            data: newVehicle,
            message: 'Vehicle added successfully'
        }
    };
};