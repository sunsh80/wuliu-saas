// backend/api/handlers/carrier/carrierSubmitStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('[Carrier API] Submit StopPoint handler called');
  
  try {
    const { id } = c.request.params;
    const userId = c.request.session?.userId;
    const tenantId = c.request.session?.tenantId;

    if (!userId || !tenantId) {
      return {
        status: 401,
        body: { success: false, error: 'UNAUTHORIZED', message: '未登录' }
      };
    }

    const db = getDb();
    
    // 检查停靠点是否存在且属于当前租户
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ? AND upload_source = ?', [id, tenantId, 'carrier']);
    if (!stopPoint) {
      return {
        status: 404,
        body: { success: false, error: 'NOT_FOUND', message: '停靠点不存在或无权操作' }
      };
    }

    // 只有草稿可以提交审批
    if (stopPoint.approval_status !== 'draft') {
      return {
        status: 400,
        body: { success: false, error: 'INVALID_STATUS', message: '只有草稿状态可以提交审批' }
      };
    }

    // 更新为待审批状态
    await db.run(
      `UPDATE stop_points SET approval_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    console.log('[Carrier API] 草稿已提交审批:', id);

    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    
    return {
      status: 200,
      body: {
        success: true,
        message: '已提交审批',
        data: updated
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] Submit StopPoint error:', error);
    return {
      status: 500,
      body: { success: false, error: 'SUBMIT_FAILED', message: error.message }
    };
  }
};
