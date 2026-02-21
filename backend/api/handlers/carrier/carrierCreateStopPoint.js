// backend/api/handlers/carrier/carrierCreateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] Create StopPoint handler called');
  console.log('   → c.session:', c.session);
  console.log('   → c.session?.userId:', c.session?.userId);
  console.log('   → c.session?.tenantId:', c.session?.tenantId);
  console.log('   → c.request.session:', c.request.session);
  console.log('   → c.request.session?.userId:', c.request.session?.userId);
  console.log('   → c.request.session?.tenantId:', c.request.session?.tenantId);

  try {
    const tenantId = c.request.session?.tenantId;
    const userId = c.request.session?.userId;
    const session = c.session || c.request.session;

    if (!tenantId) {
      console.log('   ❌ tenantId 为空，拒绝请求');
      console.log('   → session.tenantId:', session?.tenantId);
      return {
        status: 401,
        body: {
          success: false,
          error: 'UNAUTHORIZED',
          message: '未登录或租户信息不存在'
        }
      };
    }

    const body = c.request.body;
    const { name, address, lat, lng, type = 'other', region, capacity, description } = body || {};

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
    console.log('   📝 准备插入数据:', { name, address, lat, lng, tenantId: session.tenantId, userId: session.userId });
    
    const result = await db.run(
      `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status, tenant_id, uploaded_by, upload_source, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'inactive', ?, ?, 'carrier', 'pending')`,
      [name, address, parseFloat(lat), parseFloat(lng), type || 'other', region || '', capacity || 1, description || '', session.tenantId, session.userId]
    );
    
    console.log('   ✅ 插入成功，lastID:', result.lastID);

    const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);
    console.log('   📦 插入的数据:', newStopPoint);

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
