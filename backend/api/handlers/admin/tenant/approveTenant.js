// api/handlers/tenant/approveTenant.js 
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { id } = c.request.params;
  const { notes } = c.request.body;

  const database = getDb();

  const result = await database.run(
    `UPDATE tenants SET status = 'rejected', rejected_at = datetime('now'), rejection_notes = ? 
     WHERE id = ? AND status = 'pending'`,
    [notes, id]
  );

  if (result.changes === 0) {
    return {
      status: 404,
      body: { success: false, error: 'Tenant not found or not in pending status' }
    };
  }

  return {
    status: 200,
    body: { success: true, message: 'Tenant rejected successfully' }
  };
};