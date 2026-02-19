// backend/api/handlers/tenant/tenantGetMyStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const { id } = c.request.params;
    if (!tenantId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!stopPoint) { return { status: 404, body: { success: false, error: 'NOT_FOUND' } }; }
    const now = new Date();
    const createdAt = new Date(stopPoint.created_at);
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
    return { status: 200, body: { success: true, data: { ...stopPoint, deletable: daysDiff <= 3 && stopPoint.approval_status !== 'rejected' } } };
  } catch (error) {
    console.error('❌ [Tenant] Get error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
