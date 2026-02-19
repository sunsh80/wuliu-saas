// backend/api/handlers/admin/adminGetApprovalStats.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const db = getDb();
    const stats = await db.get(`SELECT COUNT(*) as total, SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected, SUM(CASE WHEN upload_source = 'tenant' THEN 1 ELSE 0 END) as from_tenant, SUM(CASE WHEN upload_source = 'manual' THEN 1 ELSE 0 END) as from_manual FROM stop_points`);
    const pendingCount = await db.get("SELECT COUNT(*) as count FROM stop_points WHERE approval_status = 'pending'");
    return { status: 200, body: { success: true, data: { ...stats, pending_count: pendingCount.count } } };
  } catch (error) {
    console.error('❌ [Admin] Get stats error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
