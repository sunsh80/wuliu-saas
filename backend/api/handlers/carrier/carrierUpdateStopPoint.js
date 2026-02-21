// backend/api/handlers/carrier/carrierUpdateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Carrier API] Update StopPoint handler called');

  try {
    const tenantId = c.request.session?.tenantId;
    const userId = c.request.session?.userId;
    const session = c.session || c.request.session;
    const { id } = c.request.params;
    const body = c.request.body;
    const { name, address, lat, lng, type, region, capacity, description } = body || {};

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

    // 已批准的停靠点不能修改
    if (existing.approval_status === 'approved') {
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: '已批准的停靠点不能修改，请联系管理员'
        }
      };
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (lat !== undefined) {
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
      updates.push('lat = ?'); params.push(parseFloat(lat));
    }
    if (lng !== undefined) {
      updates.push('lng = ?'); params.push(parseFloat(lng));
    }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (region !== undefined) { updates.push('region = ?'); params.push(region); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '没有要更新的字段'
        }
      };
    }

    // 如果修改了关键信息，需要重新审批
    if (existing.approval_status === 'approved') {
      updates.push('approval_status = ?');
      params.push('pending');
    }

    params.push(id);
    await db.run(`UPDATE stop_points SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);

    return {
      status: 200,
      body: {
        success: true,
        message: existing.approval_status === 'approved' ? '停靠点已更新，需要重新审批' : '停靠点已更新',
        data: updated
      }
    };
  } catch (error) {
    console.error('❌ [Carrier API] Update StopPoint error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'UPDATE_FAILED',
        message: error.message
      }
    };
  }
};
