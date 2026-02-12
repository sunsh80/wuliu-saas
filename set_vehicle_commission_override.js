// backend/api/handlers/admin/commission/setVehicleCommissionOverride.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 管理员设置车辆抽佣覆盖处理器启动 ---");
  
  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.warn("⚠️ Unauthorized: Admin role required");
    return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '需要管理员权限' } };
  }

  const vehicleId = c.request.params.vehicle_id;
  const { override_type, override_value, reason, effective_from, effective_until } = c.request.body;

  if (!vehicleId || !override_type || override_value === undefined) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_PARAMETERS',
        message: '缺少必要参数: vehicle_id, override_type, override_value'
      }
    };
  }

  // 验证覆盖类型
  const validOverrideTypes = ['fixed', 'percentage', 'multiplier'];
  if (!validOverrideTypes.includes(override_type)) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'INVALID_OVERRIDE_TYPE',
        message: '无效的覆盖类型，支持: fixed, percentage, multiplier'
      }
    };
  }

  // 验证覆盖值
  if (typeof override_value !== 'number' || override_value < 0) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'INVALID_OVERRIDE_VALUE',
        message: '覆盖值必须是非负数'
      }
    };
  }

  const db = getDb();
  
  try {
    // 检查车辆是否存在
    const vehicle = await db.get(`
      SELECT tv.id, tv.plate_number, t.name as tenant_name, u.name as carrier_name
      FROM tenant_vehicles tv
      JOIN users u ON tv.tenant_id = u.tenant_id
      JOIN tenants t ON u.tenant_id = t.id
      WHERE tv.id = ?
    `, [vehicleId]);

    if (!vehicle) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'VEHICLE_NOT_FOUND',
          message: '车辆不存在'
        }
      };
    }

    // 检查是否已有相同类型的活动覆盖规则
    const existingOverride = await db.get(`
      SELECT id, override_type, override_value, reason, effective_from, effective_until
      FROM vehicle_commission_overrides
      WHERE vehicle_id = ? AND is_active = 1
    `, [vehicleId]);

    // 如果存在活动的覆盖规则，先将其设为非活动状态
    if (existingOverride) {
      await db.run(`
        UPDATE vehicle_commission_overrides 
        SET is_active = 0, updated_at = datetime('now')
        WHERE id = ?
      `, [existingOverride.id]);
    }

    // 插入新的覆盖规则
    const result = await db.run(`
      INSERT INTO vehicle_commission_overrides (
        vehicle_id, override_type, override_value, reason, 
        effective_from, effective_until, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      vehicleId, 
      override_type, 
      override_value, 
      reason || '管理员设置', 
      effective_from || new Date().toISOString().split('T')[0], 
      effective_until || null, 
      c.context.id
    ]);

    // 获取新插入的记录
    const newOverride = await db.get(`
      SELECT *
      FROM vehicle_commission_overrides
      WHERE id = ?
    `, [result.lastID]);

    // 记录操作日志
    await db.run(`
      INSERT INTO system_logs (
        action, entity_type, entity_id, user_id, details, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [
      'SET_COMMISSION_OVERRIDE',
      'vehicle_commission_override',
      result.lastID,
      c.context.id,
      `为车辆 ${vehicle.plate_number} (ID: ${vehicleId}) 设置了抽佣覆盖: ${override_type} = ${override_value}`
    ]);

    return {
      status: 201,
      body: {
        success: true,
        message: '车辆抽佣覆盖设置成功',
        data: {
          override: {
            id: newOverride.id,
            vehicle_id: newOverride.vehicle_id,
            override_type: newOverride.override_type,
            override_value: newOverride.override_value,
            reason: newOverride.reason,
            effective_from: newOverride.effective_from,
            effective_until: newOverride.effective_until,
            created_at: newOverride.created_at
          },
          vehicle_info: {
            id: vehicle.id,
            plate_number: vehicle.plate_number,
            tenant_name: vehicle.tenant_name,
            carrier_name: vehicle.carrier_name
          },
          previous_override: existingOverride || null
        }
      }
    };

  } catch (error) {
    console.error('💥 [SET VEHICLE COMMISSION OVERRIDE ERROR]:', error);
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