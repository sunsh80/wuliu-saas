// api/handlers/tenant-management/approveTenantById.js
const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const tenantId = c.request.params.id;
  const database = getDb();

  const result = await database.run(
    `UPDATE tenants SET status = 'approved', approved_at = datetime('now') 
     WHERE id = ? AND status = 'pending'`,
    [tenantId]
  );

  if (result.changes === 0) {
    return {
      status: 404,
      body: { success: false, error: 'Tenant not found or not in pending status' }
    };
  }

  return {
    status: 200,
    body: { success: true, message: 'Tenant approved successfully' }
  };
};