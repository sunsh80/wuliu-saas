/**
 * 更新车型API处理程序
 * operationId: updateVehicleModel
 * 根据OpenAPI规范实现
 */

const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    console.log('=== UPDATE VEHICLE MODEL DEBUG ===');
    console.log('Vehicle Model ID:', c.request.params.id);
    console.log('Request Body:', c.request.body);
    
    const vehicleModelId = c.request.params.id;
    const vehicleModelData = c.request.body;

    // 验证ID参数
    if (!vehicleModelId || isNaN(vehicleModelId)) {
      return {
        status: 400,
        body: {
          success: false,
          message: '车型ID参数无效'
        }
      };
    }

    // 获取数据库实例
    const database = getDb();

    // 检查车型是否存在
    const existingModel = await database.get(
      'SELECT * FROM vehicle_models WHERE id = ?',
      [vehicleModelId]
    );

    if (!existingModel) {
      return {
        status: 404,
        body: {
          success: false,
          message: '车型不存在'
        }
      };
    }

    // 检查是否与其他车型冲突（除了自己之外）
    if (vehicleModelData.brand && vehicleModelData.model_name && vehicleModelData.manufacturer) {
      const duplicateCheck = await database.get(
        'SELECT id FROM vehicle_models WHERE brand = ? AND model_name = ? AND manufacturer = ? AND id != ?',
        [vehicleModelData.brand, vehicleModelData.model_name, vehicleModelData.manufacturer, vehicleModelId]
      );

      if (duplicateCheck) {
        return {
          status: 409,
          body: {
            success: false,
            message: '该车型已存在'
          }
        };
      }
    }

    // 准备更新字段
    const updatableFields = [
      'brand', 'manufacturer', 'model_name', 'vehicle_type', 'production_year',
      'battery_manufacturer', 'battery_model', 'autonomous_level', 'max_load_capacity',
      'max_volume', 'fuel_type', 'engine_displacement', 'dimensions_length',
      'dimensions_width', 'dimensions_height', 'wheelbase', 'max_speed', 'fuel_efficiency'
    ];

    const updateFields = [];
    const values = [];
    
    for (const field of updatableFields) {
      if (vehicleModelData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(vehicleModelData[field]);
      }
    }

    // 添加更新时间
    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    // 添加ID用于WHERE子句
    values.push(vehicleModelId);

    if (updateFields.length <= 1) { // 只有更新时间被设置
      return {
        status: 400,
        body: {
          success: false,
          message: '没有提供有效的更新字段'
        }
      };
    }

    // 执行更新操作
    const sql = `UPDATE vehicle_models SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await database.run(sql, values);

    // 获取更新后的车型记录
    const updatedModel = await database.get(
      'SELECT * FROM vehicle_models WHERE id = ?',
      [vehicleModelId]
    );

    console.log('Vehicle model updated successfully:', updatedModel);

    // 返回成功响应，符合OpenAPI规范
    return {
      status: 200,
      body: {
        success: true,
        message: '车型更新成功',
        data: updatedModel
      }
    };

  } catch (error) {
    console.error('更新车型失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: '更新车型失败',
        error: error.message
      }
    };
  }
};