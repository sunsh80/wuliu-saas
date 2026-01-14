// api/handlers/tenant-management/updateTenantBasicInfo.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const tenantId = c.request.params.id;
    const { name, contact_person, contact_phone, email, status, address } = c.request.body;
    const database = getDb();

    // Optional: Validate status against allowed values if needed
    const allowedStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (status && !allowedStatuses.includes(status)) {
         return {
            status: 400,
            body: {
                success: false,
                error: 'INVALID_STATUS',
                message: `Status must be one of: ${allowedStatuses.join(', ')}`
            }
        };
    }

    const result = await database.run(
        `UPDATE tenants SET name = ?, contact_person = ?, contact_phone = ?, email = ?, status = ?, address = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [name, contact_person, contact_phone, email, status, address, tenantId]
    );

    if (result.changes === 0) {
        return {
            status: 404,
            body: {
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant not found or no changes made'
            }
        };
    }

    // Return the updated tenant details
    const updatedTenant = await database.get(
        `SELECT id, name, contact_person, contact_phone, email, status, roles, created_at, updated_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating
         FROM tenants
         WHERE id = ?`,
        [tenantId]
    );

    return {
        status: 200,
        body: {
            success: true,
            data: updatedTenant,
            message: 'Tenant information updated successfully'
        }
    };
};