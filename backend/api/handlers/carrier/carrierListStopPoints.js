// backend/api/handlers/carrier/carrierListStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] List StopPoints handler called');

  try {
    const tenantId = c.session?.tenantId;

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

    const { page = 1, limit = 20, status, approvalStatus } = c.request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM stop_points WHERE tenant_id = ?';
    const countQuery = 'SELECT COUNT(*) as total FROM stop_points WHERE tenant_id = ?';
    const params = [tenantId];
    const countParams = [tenantId];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (approvalStatus) {
      query += ' AND approval_status = ?';
      countQuery += ' AND approval_status = ?';
      params.push(approvalStatus);
      countParams.push(approvalStatus);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const db = getDb();
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    const stopPoints = await db.all(query, params);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          list: stopPoints,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] List StopPoints error:', error);
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
