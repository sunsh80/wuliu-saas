// backend/api/handlers/carrier/carrierCreateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] Create StopPoint handler called');

  try {
    const tenantId = c.session?.tenantId;
    const userId = c.session?.userId;

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

    const body = await c.request.json();
    const { name, address, lat, lng, type = 'other', region, capacity, description } = body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '缺少必填字段：name, address, lat, lng'
        }
      };
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '坐标超出范围'
        }
      };
    }

    const db = getDb();
    const result = await db.run(
      `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status, tenant_id, uploaded_by, upload_source, approval_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'inactive', ?, ?, 'carrier', 'pending')`,
      [name, address, parseFloat(lat), parseFloat(lng), type || 'other', region || '', capacity || 1, description || '', tenantId, userId]
    );

    const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);

    return {
      status: 201,
      body: {
        success: true,
        message: '停靠点已提交，等待审批',
        data: newStopPoint
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] Create StopPoint error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'CREATE_FAILED',
        message: error.message
      }
    };
  }
};
