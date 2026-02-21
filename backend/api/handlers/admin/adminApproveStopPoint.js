// backend/api/handlers/admin/adminApproveStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('[Admin] 审批请求开始');
  console.log('  → c.context:', c.context);
  console.log('  → c.request.params:', c.request.params);
  console.log('  → c.request.body:', c.request.body);
  
  try {
    const { id } = c.request.params;
    const userId = c.context?.id;
    const body = c.request.body;
    const { approved, rejectionReason } = body || {};
    
    console.log('[Admin] 审批参数:', { id, userId, approved, rejectionReason });
    
    if (!userId) { 
      console.log('[Admin] 认证失败：userId 不存在');
      return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; 
    }
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    if (!stopPoint) { 
      console.log('[Admin] 停靠点不存在:', id);
      return { status: 404, body: { success: false, error: 'NOT_FOUND' } }; 
    }
    if (stopPoint.approval_status !== 'pending') { 
      console.log('[Admin] 状态不是待审批:', stopPoint.approval_status);
      return { status: 400, body: { success: false, error: 'INVALID_STATUS' } }; 
    }
    if (approved) {
      await db.run(`UPDATE stop_points SET approval_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, status = 'active' WHERE id = ?`, [userId, id]);
      console.log('[Admin] 已通过:', id);
    } else {
      if (!rejectionReason) { 
        console.log('[Admin] 驳回原因必填');
        return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '驳回原因必填' } }; 
      }
      await db.run(`UPDATE stop_points SET approval_status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?, status = 'inactive' WHERE id = ?`, [userId, rejectionReason, id]);
      console.log('[Admin] 已驳回:', id);
    }
    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    return { status: 200, body: { success: true, message: approved ? '已通过' : '已驳回', data: updated } };
  } catch (error) {
    console.error('❌ [Admin] Approve error:', error);
    return { status: 500, body: { success: false, error: 'APPROVAL_FAILED', message: error.message } };
  }
};
