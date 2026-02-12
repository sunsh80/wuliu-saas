// backend/api/handlers/admin/risk-control/processViolationRecord.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 风控违规记录处理处理器启动 ---");
  
  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.warn("⚠️ Unauthorized: Admin role required");
    return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '需要管理员权限' } };
  }

  const recordId = c.request.params.record_id;
  const { action, penalty_points, appeal_approved, notes } = c.request.body;

  if (!recordId || !action) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_PARAMETERS',
        message: '缺少必要参数: record_id 和 action'
      }
    };
  }

  const db = getDb();
  
  try {
    // 获取违规记录
    const record = await db.get(`
      SELECT vr.*, t.name as target_name, t.avg_rating, o.tracking_number
      FROM violation_records vr
      JOIN tenants t ON vr.target_id = t.id
      JOIN orders o ON vr.order_id = o.id
      WHERE vr.id = ?
    `, [recordId]);

    if (!record) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '违规记录不存在'
        }
      };
    }

    if (record.status !== 'pending') {
      return {
        status: 400,
        body: {
          success: false,
          error: 'RECORD_NOT_PENDING',
          message: '违规记录状态不是待处理状态，无法操作'
        }
      };
    }

    // 根据操作类型处理
    let updatedPenaltyPoints = penalty_points || record.penalty_points;
    let status = 'processed';
    let processedNotes = notes || '';

    if (action === 'approve') {
      // 批准处罚
      status = 'processed';
      processedNotes = `批准处罚: ${notes || '管理员批准'}`;
    } else if (action === 'reject') {
      // 拒绝处罚
      status = 'rejected';
      updatedPenaltyPoints = 0;
      processedNotes = `拒绝处罚: ${notes || '管理员拒绝'}`;
    } else if (action === 'appeal_approve') {
      // 批准申诉
      status = 'appeal_approved';
      updatedPenaltyPoints = 0;
      processedNotes = `申诉批准: ${notes || '申诉已批准'}`;
    } else if (action === 'appeal_reject') {
      // 拒绝申诉
      status = 'appeal_rejected';
      processedNotes = `申诉拒绝: ${notes || '申诉被拒绝'}`;
    } else {
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ACTION',
          message: '无效的操作类型'
        }
      };
    }

    // 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 更新违规记录
    await db.run(`
      UPDATE violation_records 
      SET status = ?, penalty_points = ?, processed_by = ?, processed_at = datetime('now'), notes = ?
      WHERE id = ?
    `, [status, updatedPenaltyPoints, c.context.id, processedNotes, recordId]);

    // 如果是批准处罚，更新目标用户的处罚积分
    if ((action === 'approve' || action === 'appeal_reject') && updatedPenaltyPoints > 0) {
      // 更新租户的处罚积分
      await db.run(`
        UPDATE tenants 
        SET penalty_points = COALESCE(penalty_points, 0) + ?, 
            updated_at = datetime('now')
        WHERE id = ?
      `, [updatedPenaltyPoints, record.target_id]);

      // 检查处罚积分是否超过阈值，执行相应措施
      const updatedTenant = await db.get(`
        SELECT id, penalty_points, avg_rating 
        FROM tenants 
        WHERE id = ?
      `, [record.target_id]);

      if (updatedTenant.penalty_points >= 100) {
        // 暂停账户
        await db.run(`
          UPDATE tenants 
          SET status = 'suspended', 
              suspension_reason = '处罚积分过高',
              updated_at = datetime('now')
          WHERE id = ?
        `, [record.target_id]);
        
        processedNotes += ` | 账户因处罚积分(${updatedTenant.penalty_points})过高被暂停`;
      } else if (updatedTenant.penalty_points >= 50) {
        // 发出警告
        processedNotes += ` | 账户因处罚积分(${updatedTenant.penalty_points})过高被警告`;
      }
    }

    await db.run('COMMIT');

    return {
      status: 200,
      body: {
        success: true,
        message: '违规记录处理成功',
        data: {
          record_id: recordId,
          action: action,
          status: status,
          penalty_points: updatedPenaltyPoints,
          processed_notes: processedNotes
        }
      }
    };

  } catch (error) {
    console.error('💥 [PROCESS VIOLATION RECORD ERROR]:', error);
    await db.run('ROLLBACK');
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误'
      }
    };
  }
};