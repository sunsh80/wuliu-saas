// backend/api/handlers/admin/tenants/approveTenant.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const tenantId = c.request.params.id;
  const db = getDb();

  try {
    // 1. 激活租户
    const tenantResult = await db.run(
      `UPDATE tenants 
       SET status = 'active', approved_at = datetime('now')
       WHERE id = ? AND status = 'pending'`,
      [tenantId]
    );

    if (tenantResult.changes === 0) {
      return {
        status: 404,
        body: { success: false, error: 'Tenant not found or not in pending status' }
      };
    }

    // 2. 激活用户（关键！）
    await db.run(
      `UPDATE users 
       SET is_active = 1, status = 'active'
       WHERE tenant_id = ?`,
      [tenantId]
    );

    return {
      status: 200,
      body: { success: true, message: 'Tenant approved successfully' }
    };

  } catch (err) {
    console.error('Approve tenant failed:', err);
    return {
      status: 500,
      body: { success: false, error: 'Database operation failed' }
    };
  }
};