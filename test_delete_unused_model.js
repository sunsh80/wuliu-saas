const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000';

// 存储认证令牌
let authToken = '';

async function testDeleteUnusedModel() {
  console.log('🔍 开始测试删除未使用的车型...\n');

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

    // 2. 创建一个临时车型用于测试删除
    console.log('🆕 步骤2: 创建临时车型用于测试删除');
    const tempVehicleModel = {
      brand: '测试删除品牌',
      manufacturer: '测试删除制造商',
      model_name: '测试删除型号TEMP',
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

    const createResponse = await axios.post(`${BASE_URL}/api/admin/vehicle-models`, tempVehicleModel, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    });

    if (createResponse.data.success) {
      console.log('✅ 创建临时车型成功');
      console.log(`   - ID: ${createResponse.data.data.id}`);
      console.log(`   - 品牌: ${createResponse.data.data.brand}`);
      console.log(`   - 型号: ${createResponse.data.data.model_name}\n`);

      const createdId = createResponse.data.data.id;

      // 3. 尝试删除这个刚创建的车型（应该可以成功，因为它还没有被任何车辆使用）
      console.log('🗑️ 步骤3: 删除临时车型');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (deleteResponse.data.success) {
        console.log('✅ 删除车型成功');
        console.log(`   - 消息: ${deleteResponse.data.message}\n`);
      } else {
        console.error('❌ 删除车型失败:', deleteResponse.data.message);
        if (deleteResponse.data.error === 'MODEL_IN_USE') {
          console.log('   - 提示: 车型正在被使用，无法删除');
        }
      }
      
      console.log('🎉 删除未使用车型测试完成！');
    } else {
      console.error('❌ 创建临时车型失败');
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDeleteUnusedModel();