// api/handlers/tenant-management/listPendingTenants.js
const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const database = getDb();

  const tenants = await database.all(
    `SELECT id, name, contact_person, contact_phone, email, created_at 
     FROM tenants 
     WHERE status = 'pending'`
  );

  return {
    status: 200,
    body: { success: true, data: tenants }
  };
};