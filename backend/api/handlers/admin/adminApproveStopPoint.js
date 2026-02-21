// backend/api/handlers/admin/adminApproveStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { id } = c.request.params;
    const userId = c.context?.id;
    const body = c.request.body;
    const { approved, rejectionReason } = body || {};
    if (!userId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    if (!stopPoint) { return { status: 404, body: { success: false, error: 'NOT_FOUND' } }; }
    if (stopPoint.approval_status !== 'pending') { return { status: 400, body: { success: false, error: 'INVALID_STATUS' } }; }
    if (approved) {
      await db.run(`UPDATE stop_points SET approval_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, status = 'active' WHERE id = ?`, [userId, id]);
    } else {
      if (!rejectionReason) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '驳回原因必填' } }; }
      await db.run(`UPDATE stop_points SET approval_status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?, status = 'inactive' WHERE id = ?`, [userId, rejectionReason, id]);
    }
    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    return { status: 200, body: { success: true, message: approved ? '已通过' : '已驳回', data: updated } };
  } catch (error) {
    console.error('❌ [Admin] Approve error:', error);
    return { status: 500, body: { success: false, error: 'APPROVAL_FAILED', message: error.message } };
  }
};
