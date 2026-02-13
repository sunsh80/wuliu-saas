/**
 * 承运商车辆API处理程序（与车型库集成）- 更新车辆信息
 */

const { getDb } = require('../../../../db');

// 更新车辆信息
async function updateTenantVehicle(req, res) {
  const vehicleId = req.params.id;
  const tenantId = req.session.userId;
  const updates = req.body;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }

  const db = getDb();

  // 检查车辆是否存在且属于当前承运商
  db.get('SELECT * FROM tenant_vehicles WHERE id = ? AND tenant_id = ?', [vehicleId, tenantId], (err, existingVehicle) => {
    if (err) {
      console.error('查询车辆信息失败:', err);
      return res.status(500).json({
        success: false,
        message: '查询车辆信息失败',
        error: err.message
      });
    }

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: '车辆不存在或不属于当前承运商'
      });
    }

    // 构建更新语句
    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'tenant_id' && key !== 'created_at' && key !== 'vehicle_model_id') {
        // 不允许更新车型ID，因为车辆一旦创建就不能更改车型
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供有效的更新字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(...params, vehicleId, tenantId);

    const query = `UPDATE tenant_vehicles SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`;

    db.run(query, params, (err) => {
      if (err) {
        console.error('更新车辆信息失败:', err);
        return res.status(500).json({
          success: false,
          message: '更新车辆信息失败',
          error: err.message
        });
      }

      const updatedVehicleQuery = `
        SELECT
          tv.*,
          vm.brand,
          vm.model_name,
          vm.manufacturer,
          vm.vehicle_type as model_vehicle_type,
          vm.max_load_capacity,
          vm.max_volume as model_max_volume
        FROM tenant_vehicles tv
        LEFT JOIN vehicle_models vm ON tv.vehicle_model_id = vm.id
        WHERE tv.id = ?
      `;

      db.get(updatedVehicleQuery, [vehicleId], (err, updatedVehicle) => {
        if (err) {
          console.error('查询更新后的车辆信息失败:', err);
          return res.status(500).json({
            success: false,
            message: '查询更新后的车辆信息失败',
            error: err.message
          });
        }

        res.json({
          success: true,
          message: '车辆信息更新成功',
          data: updatedVehicle
        });
      });
    });
  });
}

module.exports = updateTenantVehicle;