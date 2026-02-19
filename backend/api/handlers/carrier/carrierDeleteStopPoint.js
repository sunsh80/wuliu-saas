// backend/api/handlers/carrier/carrierDeleteStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] Delete StopPoint handler called');

  try {
    const tenantId = c.session?.tenantId;
    const { id } = c.request.params;

    if (!tenantId) {
      return {
        status: 401,
        body: {
          success: false,
          error: 'UNAUTHORIZED',
          message: '未登录或租户信息不存在'
        }
      };
    }

    if (!id) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '停靠点 ID 是必填的'
        }
      };
    }

    const db = getDb();
    const existing = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    if (!existing) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '停靠点不存在'
        }
      };
    }

    // 检查是否超过 3 天
    const createdAt = new Date(existing.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) {
      return {
        status: 403,
        body: {
          success: false,
          error: 'DELETE_FORBIDDEN',
          message: '提交超过 3 天的停靠点不能删除，请联系管理员'
        }
      };
    }

    await db.run('DELETE FROM stop_points WHERE id = ?', [id]);

    return {
      status: 200,
      body: {
        success: true,
        message: '停靠点已删除'
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] Delete StopPoint error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'DELETE_FAILED',
        message: error.message
      }
    };
  }
};
