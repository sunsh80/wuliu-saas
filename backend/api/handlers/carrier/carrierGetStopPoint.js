// backend/api/handlers/carrier/carrierGetStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] Get StopPoint handler called');

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
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    if (!stopPoint) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'NOT_FOUND',
          message: '停靠点不存在'
        }
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        data: stopPoint
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] Get StopPoint error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'FETCH_FAILED',
        message: error.message
      }
    };
  }
};
