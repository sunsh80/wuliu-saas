// backend/api/handlers/tenant/tenantDeleteMyStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const { id } = c.request.params;
    if (!tenantId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!stopPoint) { return { status: 404, body: { success: false, error: 'NOT_FOUND' } }; }
    if (stopPoint.approval_status === 'approved' || stopPoint.approval_status === 'rejected') { return { status: 403, body: { success: false, error: 'DELETE_FORBIDDEN', message: '已审批的停靠点不允许删除' } }; }
    const createdAt = new Date(stopPoint.created_at);
    const now = new Date();
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (daysDiff > 3) { return { status: 403, body: { success: false, error: 'DELETE_FORBIDDEN', message: '上传超过 3 天不允许删除' } }; }
    await db.run('DELETE FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return { status: 200, body: { success: true, message: '删除成功' } };
  } catch (error) {
    console.error('❌ [Tenant] Delete error:', error);
    return { status: 500, body: { success: false, error: 'DELETE_FAILED', message: error.message } };
  }
};
