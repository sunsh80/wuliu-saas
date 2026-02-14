/**
 * 创建车型API处理程序 - 调试版本
 * operationId: createVehicleModel
 * 根据OpenAPI规范实现
 */

const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    console.log('=== CREATE VEHICLE MODEL DEBUG START ===');
    console.log('Request Body received:', c.request.body);
    
    const vehicleModelData = c.request.body;

    // 验证必需字段
    const requiredFields = ['brand', 'manufacturer', 'model_name', 'vehicle_type'];
    for (const field of requiredFields) {
      if (!vehicleModelData[field]) {
        console.log(`Missing required field: ${field}`);
        return {
          status: 400,
          body: {
            success: false,
            message: `缺少必需字段: ${field}`,
            error: `Field '${field}' is required`
          }
        };
      }
    }
    
    console.log('Required fields validation passed');

    // 获取数据库实例
    const database = getDb();
    console.log('Database connection acquired');

    // 检查车型是否已存在（基于品牌、型号和制造商的组合）
    console.log('Checking for existing model...');
    const existingModel = await database.get(
      'SELECT id FROM vehicle_models WHERE brand = ? AND model_name = ? AND manufacturer = ?',
      [vehicleModelData.brand, vehicleModelData.model_name, vehicleModelData.manufacturer]
    );
    
    console.log('Existing model check completed, result:', existingModel);
    
    if (existingModel) {
      console.log('Duplicate model found, returning 409');
      return {
        status: 409,
        body: {
          success: false,
          message: '该车型已存在'
        }
      };
    }

    // 准备插入数据
    const {
      brand, manufacturer, model_name, vehicle_type, production_year,
      battery_manufacturer, battery_model, autonomous_level = 'L0', 
      max_load_capacity, max_volume, fuel_type, engine_displacement,
      dimensions_length, dimensions_width, dimensions_height, 
      wheelbase, max_speed, fuel_efficiency
    } = vehicleModelData;

    // 构建SQL插入语句和参数
    const fields = [
      'brand', 'manufacturer', 'model_name', 'vehicle_type', 'production_year',
      'battery_manufacturer', 'battery_model', 'autonomous_level',
      'max_load_capacity', 'max_volume', 'fuel_type', 'engine_displacement',
      'dimensions_length', 'dimensions_width', 'dimensions_height',
      'wheelbase', 'max_speed', 'fuel_efficiency', 'created_at', 'updated_at'
    ];
    
    const placeholders = fields.map(() => '?').join(',');
    const sql = `INSERT INTO vehicle_models (${fields.join(',')}) VALUES (${placeholders})`;
    
    const values = [
      brand, manufacturer, model_name, vehicle_type, production_year,
      battery_manufacturer, battery_model, autonomous_level,
      max_load_capacity, max_volume, fuel_type, engine_displacement,
      dimensions_length, dimensions_width, dimensions_height,
      wheelbase, max_speed, fuel_efficiency,
      new Date().toISOString(), new Date().toISOString()
    ];

    console.log('About to execute INSERT query...');
    console.log('SQL:', sql);
    console.log('Values:', values);

    // 执行插入操作
    console.log('Executing database run operation...');
    const result = await database.run(sql, values);
    console.log('Database run completed, result:', result);

    // 获取新插入的车型记录
    console.log('Fetching newly inserted record with ID:', result.lastID);
    const newVehicleModel = await database.get(
      'SELECT * FROM vehicle_models WHERE id = ?',
      [result.lastID]
    );
    console.log('New vehicle model fetched:', newVehicleModel);

    console.log('Vehicle model created successfully:', newVehicleModel);

    // 返回成功响应，符合OpenAPI规范
    return {
      status: 201,  // 201 Created for POST requests
      body: {
        success: true,
        message: '车型创建成功',
        data: newVehicleModel
      }
    };

  } catch (error) {
    console.error('创建车型失败:', error);
    console.error('Error stack:', error.stack);
    return {
      status: 500,
      body: {
        success: false,
        message: '创建车型失败',
        error: error.message
      }
    };
  }
};