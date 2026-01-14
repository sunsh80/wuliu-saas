// api/handlers/tenant-management/updateTenantContactInfo.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const tenantId = c.request.params.id;
    const { finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email } = c.request.body;
    const database = getDb();

    // Check if contact info exists for this tenant
    const existingRecord = await database.get(
        `SELECT id FROM tenant_contact_info WHERE tenant_id = ?`,
        [tenantId]
    );

    let result;
    if (existingRecord) {
        // Update existing record
        result = await database.run(
            `UPDATE tenant_contact_info SET finance_contact_name = ?, finance_contact_phone = ?, finance_contact_email = ?, support_contact_name = ?, support_contact_phone = ?, support_contact_email = ?, updated_at = datetime('now')
             WHERE tenant_id = ?`,
            [finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email, tenantId]
        );
    } else {
        // Insert new record
        result = await database.run(
            `INSERT INTO tenant_contact_info (tenant_id, finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [tenantId, finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email]
        );
    }

    if (result.changes === 0) {
        return {
            status: 404,
            body: {
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant not found'
            }
        };
    }

    // Return the updated contact info
    const updatedContactInfo = await database.get(
        `SELECT finance_contact_name, finance_contact_phone, finance_contact_email, support_contact_name, support_contact_phone, support_contact_email, created_at, updated_at
         FROM tenant_contact_info
         WHERE tenant_id = ?`,
        [tenantId]
    );

    return {
        status: 200,
        body: {
            success: true,
            data: updatedContactInfo,
            message: 'Tenant contact information updated successfully'
        }
    };
};