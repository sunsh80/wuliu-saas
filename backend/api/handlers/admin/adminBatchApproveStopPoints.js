// backend/api/handlers/admin/adminBatchApproveStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const userId = c.context?.id;
    const body = await c.request.json();
    const { ids, approved, rejectionReason } = body;
    if (!userId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    if (!Array.isArray(ids) || ids.length === 0) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR' } }; }
    if (!approved && !rejectionReason) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '驳回原因必填' } }; }
    const db = getDb();
    const successIds = [], errors = [];
    for (const id of ids) {
      try {
        const sp = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
        if (!sp) { errors.push({ id, error: '不存在' }); continue; }
        if (sp.approval_status !== 'pending') { errors.push({ id, error: '状态不是待审批' }); continue; }
        if (approved) {
          await db.run(`UPDATE stop_points SET approval_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, status = 'active' WHERE id = ?`, [userId, id]);
        } else {
          await db.run(`UPDATE stop_points SET approval_status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?, status = 'inactive' WHERE id = ?`, [userId, rejectionReason, id]);
        }
        successIds.push(id);
      } catch (err) { errors.push({ id, error: err.message }); }
    }
    return { status: 200, body: { success: true, message: `审批完成：成功 ${successIds.length} 条`, data: { successIds, errors } } };
  } catch (error) {
    console.error('❌ [Admin] Batch approve error:', error);
    return { status: 500, body: { success: false, error: 'BATCH_APPROVAL_FAILED', message: error.message } };
  }
};
