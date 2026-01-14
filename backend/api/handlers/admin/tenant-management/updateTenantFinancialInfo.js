// api/handlers/tenant-management/updateTenantFinancialInfo.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const tenantId = c.request.params.id;
    const { bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance } = c.request.body;
    const database = getDb();

    // Check if financial info exists for this tenant
    const existingRecord = await database.get(
        `SELECT id FROM tenant_financial_info WHERE tenant_id = ?`,
        [tenantId]
    );

    let result;
    if (existingRecord) {
        // Update existing record
        result = await database.run(
            `UPDATE tenant_financial_info SET bank_account_number = ?, bank_name = ?, tax_id = ?, settlement_cycle = ?, credit_limit = ?, outstanding_balance = ?, updated_at = datetime('now')
             WHERE tenant_id = ?`,
            [bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance, tenantId]
        );
    } else {
        // Insert new record
        result = await database.run(
            `INSERT INTO tenant_financial_info (tenant_id, bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [tenantId, bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance]
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

    // Return the updated financial info
    const updatedFinancialInfo = await database.get(
        `SELECT bank_account_number, bank_name, tax_id, settlement_cycle, credit_limit, outstanding_balance, created_at, updated_at
         FROM tenant_financial_info
         WHERE tenant_id = ?`,
        [tenantId]
    );

    return {
        status: 200,
        body: {
            success: true,
            data: updatedFinancialInfo,
            message: 'Tenant financial information updated successfully'
        }
    };
};