/**
 * 获取车型详情API处理程序
 * operationId: getVehicleModel
 * 根据OpenAPI规范实现
 */

const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    console.log('=== GET VEHICLE MODEL DEBUG ===');
    console.log('Vehicle Model ID:', c.request.params.id);
    
    const vehicleModelId = c.request.params.id;

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

    // 查询车型详情（排除已删除的车型）
    const vehicleModel = await database.get(
      'SELECT * FROM vehicle_models WHERE id = ? AND status != \'deleted\'',
      [vehicleModelId]
    );

    if (!vehicleModel) {
      return {
        status: 404,
        body: {
          success: false,
          message: '车型不存在'
        }
      };
    }

    console.log('Vehicle model retrieved successfully:', vehicleModel);

    // 返回成功响应，符合OpenAPI规范
    return {
      status: 200,
      body: {
        success: true,
        data: vehicleModel
      }
    };

  } catch (error) {
    console.error('获取车型详情失败:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: '获取车型详情失败',
        error: error.message
      }
    };
  }
};