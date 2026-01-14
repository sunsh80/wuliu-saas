// api/handlers/tenant-management/getTenantById.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const tenantId = c.request.params.id;
    const database = getDb();

    // Fetch basic tenant info
    const basicInfo = await database.get(
        `SELECT id, name, contact_person, contact_phone, email, status, roles, created_at, updated_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating
         FROM tenants
         WHERE id = ?`,
        [tenantId]
    );

    if (!basicInfo) {
        return {
            status: 404,
            body: {
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant not found'
            }
        };
    }

    // Fetch vehicles
    const vehicles = await database.all(
        `SELECT id, plate_number, type, length, width, height, max_weight, volume, status, driver_name, driver_phone, image_url, created_at, updated_at
         FROM tenant_vehicles
         WHERE tenant_id = ?`,
        [tenantId]
    );

    // Fetch financial info
    const financialInfo = await database.get(
        `SELECT bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance, created_at, updated_at
         FROM tenant_financial_info
         WHERE tenant_id = ?`,
        [tenantId]
    );

    // Fetch contact info
    const contactInfo = await database.get(
        `SELECT finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email, created_at, updated_at
         FROM tenant_contact_info
         WHERE tenant_id = ?`,
        [tenantId]
    );

    // Combine all data
    const tenantDetails = {
        ...basicInfo,
        vehicles: vehicles || [],
        financial_info: financialInfo || null,
        contact_info: contactInfo || null
    };

    return {
        status: 200,
        body: {
            success: true,
            data: tenantDetails
        }
    };
};