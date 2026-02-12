// backend/api/handlers/carrier/vehicle/getAvailableVehicles.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商获取可用车辆处理器启动 ---");
  const userId = c.context?.id;
  console.log("Received request to get available vehicles for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  // 检查角色
  if (!c.context.roles.includes('carrier')) {
    console.log("User does not have 'carrier' role.");
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 获取查询参数
    const queryParams = c.request.query;
    const orderWeight = parseFloat(queryParams.weight) || 0;
    const orderVolume = parseFloat(queryParams.volume) || 0;
    const orderCargoType = queryParams.cargo_type || null;
    const orderRequiredVehicleType = queryParams.vehicle_type || null;

    // 查询承运商的所有车辆
    const vehicles = await db.all(`
      SELECT 
        v.id,
        v.plate_number,
        v.type as vehicle_type,
        v.length,
        v.width,
        v.height,
        v.max_weight,
        v.volume,
        v.status,
        v.driver_name,
        v.driver_phone,
        v.image_url,
        v.current_active_orders,
        v.max_active_orders,
        v.penalty_points,
        v.penalty_expiry_time,
        v.created_at,
        v.updated_at,
        -- 计算剩余容量
        (v.max_weight - COALESCE(current_load.current_weight, 0)) as remaining_weight_capacity,
        (v.volume - COALESCE(current_load.current_volume, 0)) as remaining_volume_capacity,
        -- 检查是否在处罚期内
        CASE 
          WHEN v.penalty_expiry_time IS NOT NULL AND datetime('now') < v.penalty_expiry_time 
          THEN 1 
          ELSE 0 
        END as is_under_penalty
      FROM tenant_vehicles v
      JOIN users u ON v.tenant_id = u.tenant_id
      -- 计算当前负载
      LEFT JOIN (
        SELECT 
          vehicle_id,
          SUM(o.weight_kg) as current_weight,
          SUM(o.volume_m3) as current_volume
        FROM orders o
        WHERE o.status IN ('pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit')
        GROUP BY vehicle_id
      ) current_load ON v.id = current_load.vehicle_id
      WHERE u.id = ?
      ORDER BY v.current_active_orders ASC, v.max_weight DESC
    `, [userId]);

    // 过滤出符合条件的可用车辆
    const availableVehicles = vehicles.filter(vehicle => {
      // 1. 车辆状态必须是活跃的
      if (vehicle.status !== 'active') {
        return false;
      }

      // 2. 车辆不能在处罚期内
      if (vehicle.is_under_penalty) {
        return false;
      }

      // 3. 车辆当前活跃订单数不能达到上限
      if (vehicle.current_active_orders >= vehicle.max_active_orders) {
        return false;
      }

      // 4. 检查载重能力
      if (orderWeight > 0 && orderWeight > vehicle.remaining_weight_capacity) {
        return false;
      }

      // 5. 检查体积能力
      if (orderVolume > 0 && orderVolume > vehicle.remaining_volume_capacity) {
        return false;
      }

      // 6. 检查车型要求
      if (orderRequiredVehicleType && vehicle.vehicle_type !== orderRequiredVehicleType) {
        return false;
      }

      // 7. 检查货物类型兼容性（简化处理，实际可能需要更复杂的逻辑）
      if (orderCargoType) {
        // 这方简化：普通货车不能运输冷藏货物
        if (orderCargoType === 'cold_storage' && !vehicle.vehicle_type.includes('refrigerated')) {
          return false;
        }
      }

      return true;
    });

    // 添加额外信息
    const resultVehicles = availableVehicles.map(vehicle => ({
      ...vehicle,
      available: true,
      remaining_capacity: {
        weight: vehicle.remaining_weight_capacity,
        volume: vehicle.remaining_volume_capacity
      },
      utilization_rate: vehicle.max_active_orders > 0 ? 
        (vehicle.current_active_orders / vehicle.max_active_orders * 100).toFixed(2) + '%' : '0%',
      penalty_status: vehicle.is_under_penalty ? 'under_penalty' : 'normal',
      can_accept_order: true
    }));

    // 添加所有车辆信息（包括不可用的）用于参考
    const allVehiclesWithStatus = vehicles.map(vehicle => ({
      ...vehicle,
      available: availableVehicles.some(av => av.id === vehicle.id),
      reason_not_available: !availableVehicles.some(av => av.id === vehicle.id) ? getUnavailableReason(vehicle, { weight: orderWeight, volume: orderVolume }) : null,
      remaining_capacity: {
        weight: vehicle.remaining_weight_capacity,
        volume: vehicle.remaining_volume_capacity
      },
      utilization_rate: vehicle.max_active_orders > 0 ? 
        (vehicle.current_active_orders / vehicle.max_active_orders * 100).toFixed(2) + '%' : '0%',
      penalty_status: vehicle.is_under_penalty ? 'under_penalty' : 'normal'
    }));

    return {
      status: 200,
      body: {
        success: true,
        message: '获取可用车辆成功',
        data: {
          available_vehicles: resultVehicles,
          all_vehicles: allVehiclesWithStatus,
          summary: {
            total_vehicles: vehicles.length,
            available_vehicles_count: resultVehicles.length,
            order_requirements: {
              weight: orderWeight,
              volume: orderVolume,
              cargo_type: orderCargoType,
              vehicle_type: orderRequiredVehicleType
            }
          }
        }
      }
    };

  } catch (error) {
    console.error('💥 [GET AVAILABLE VEHICLES HANDLER ERROR]:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR', 
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' 
      } 
    };
  }
};

// 辅助函数：获取车辆不可用的原因
function getUnavailableReason(vehicle, orderRequirements) {
  const reasons = [];

  if (vehicle.status !== 'active') {
    reasons.push('车辆状态非活跃');
  }

  if (vehicle.is_under_penalty) {
    reasons.push('车辆处于处罚期');
  }

  if (vehicle.current_active_orders >= vehicle.max_active_orders) {
    reasons.push(`活跃订单已达上限(${vehicle.max_active_orders}个)`);
  }

  if (orderRequirements.weight > 0 && orderRequirements.weight > vehicle.remaining_weight_capacity) {
    reasons.push(`载重不足(需${orderRequirements.weight}kg, 剩余${vehicle.remaining_weight_capacity}kg)`);
  }

  if (orderRequirements.volume > 0 && orderRequirements.volume > vehicle.remaining_volume_capacity) {
    reasons.push(`体积不足(需${orderRequirements.volume}m³, 剩余${vehicle.remaining_volume_capacity}m³)`);
  }

  return reasons.join('; ');
}