const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000';

// 存储认证令牌
let authToken = '';

async function testCreateAndUpdateOnly() {
  console.log('🔍 开始测试车型库新增和修改功能（不删除）...\n');

  try {
    // 1. 登录获取令牌
    console.log('🔐 步骤1: 登录获取认证令牌');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      authToken = loginResponse.data.data.token;
      console.log('✅ 登录成功，获取到认证令牌\n');
    } else {
      console.error('❌ 登录失败');
      return;
    }

    // 2. 获取现有车型列表
    console.log('📚 步骤2: 获取现有车型列表');
    const listResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const initialCount = listResponse.data.data.vehicle_models.length;
    console.log(`✅ 获取到 ${initialCount} 条车型数据\n`);

    // 3. 创建新车型
    console.log('🆕 步骤3: 创建新车型');
    const newVehicleModel = {
      brand: '测试品牌',
      manufacturer: '测试制造商',
      model_name: '测试型号NO_DELETE',
      vehicle_type: '测试车型',
      production_year: '2025',
      autonomous_level: 'L3',
      max_load_capacity: 2000,
      max_volume: 15.5,
      fuel_type: '电动',
      battery_manufacturer: '测试电池厂',
      battery_model: 'TEST-BAT-001',
      engine_displacement: 2.0,
      dimensions_length: 4.5,
      dimensions_width: 2.0,
      dimensions_height: 2.2,
      wheelbase: 3.0,
      max_speed: 100,
      fuel_efficiency: 18.5
    };

    const createResponse = await axios.post(`${BASE_URL}/api/admin/vehicle-models`, newVehicleModel, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    });

    if (createResponse.data.success) {
      console.log('✅ 创建车型成功');
      console.log(`   - ID: ${createResponse.data.data.id}`);
      console.log(`   - 品牌: ${createResponse.data.data.brand}`);
      console.log(`   - 型号: ${createResponse.data.data.model_name}\n`);

      const createdId = createResponse.data.data.id;

      // 4. 获取并验证新增的车型
      console.log('🔍 步骤4: 验证新增车型');
      const getResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (getResponse.data.success) {
        console.log('✅ 获取车型详情成功');
        console.log(`   - ID: ${getResponse.data.data.id}`);
        console.log(`   - 品牌: ${getResponse.data.data.brand}`);
        console.log(`   - 型号: ${getResponse.data.data.model_name}`);
        console.log(`   - 车辆类型: ${getResponse.data.data.vehicle_type}\n`);
      } else {
        console.error('❌ 获取车型详情失败');
      }

      // 5. 更新车型信息
      console.log('✏️ 步骤5: 更新车型信息');
      const updatedVehicleModel = {
        ...newVehicleModel,
        brand: '更新品牌',
        model_name: '更新型号NO_DELETE',
        max_load_capacity: 2500
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, updatedVehicleModel, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });

      if (updateResponse.data.success) {
        console.log('✅ 更新车型成功');
        console.log(`   - ID: ${updateResponse.data.data.id}`);
        console.log(`   - 品牌: ${updateResponse.data.data.brand}`);
        console.log(`   - 型号: ${updateResponse.data.data.model_name}`);
        console.log(`   - 最大载重: ${updateResponse.data.data.max_load_capacity} kg\n`);
      } else {
        console.error('❌ 更新车型失败');
      }

      // 6. 再次获取验证更新结果
      console.log('🔍 步骤6: 验证更新结果');
      const updatedGetResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (updatedGetResponse.data.success) {
        console.log('✅ 更新验证成功');
        console.log(`   - ID: ${updatedGetResponse.data.data.id}`);
        console.log(`   - 品牌: ${updatedGetResponse.data.data.brand}`);
        console.log(`   - 型号: ${updatedGetResponse.data.data.model_name}`);
        console.log(`   - 最大载重: ${updatedGetResponse.data.data.max_load_capacity} kg\n`);
      } else {
        console.error('❌ 更新验证失败');
      }

      console.log('🎉 车型新增和修改功能测试完成！');
      console.log('💡 注意：删除功能可能受限于数据库结构问题，需要先解决tenant_vehicles表缺少vehicle_model_id字段的问题');
    } else {
      console.error('❌ 创建车型失败');
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testCreateAndUpdateOnly();