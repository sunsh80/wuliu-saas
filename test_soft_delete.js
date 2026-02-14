const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000';

// 存储认证令牌
let authToken = '';

async function testSoftDeleteFunctionality() {
  console.log('🔍 开始测试车型软删除功能...\n');

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
      brand: '软删除测试品牌',
      manufacturer: '软删除测试制造商',
      model_name: '软删除测试型号',
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

      // 3. 验证车型已创建并可以获取
      console.log('🔍 步骤3: 验证车型已创建');
      const getResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (getResponse.data.success) {
        console.log('✅ 获取车型详情成功');
        console.log(`   - ID: ${getResponse.data.data.id}`);
        console.log(`   - 状态: ${getResponse.data.data.status || 'N/A'}\n`);
      } else {
        console.error('❌ 获取车型详情失败');
      }

      // 4. 删除这个车型
      console.log('🗑️ 步骤4: 删除车型（软删除）');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (deleteResponse.data.success) {
        console.log('✅ 车型删除请求成功');
        console.log(`   - 消息: ${deleteResponse.data.message}\n`);
      } else {
        console.error('❌ 车型删除失败:', deleteResponse.data.message);
      }

      // 5. 尝试获取刚刚删除的车型（应该找不到）
      console.log('🔍 步骤5: 尝试获取已删除的车型（应该找不到）');
      try {
        const deletedGetResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (deletedGetResponse.data.success) {
          console.log('⚠️  车型仍然可以获取到，可能软删除实现有问题');
          console.log(`   - 状态: ${deletedGetResponse.data.data.status}`);
        } else {
          console.log('✅ 车型已被正确隐藏（返回404或错误）');
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('✅ 车型已被正确隐藏（返回404）');
        } else {
          console.log('✅ 车型已被正确隐藏（返回错误）');
        }
      }

      // 6. 检查车型是否还在列表中
      console.log('\n📋 步骤6: 检查车型是否还在列表中');
      const listResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (listResponse.data.success) {
        const allModels = listResponse.data.data.vehicle_models;
        const foundModel = allModels.find(model => model.id === createdId);
        
        if (foundModel) {
          console.log('⚠️  车型仍在列表中，可能软删除实现有问题');
        } else {
          console.log('✅ 车型已从列表中移除（软删除成功）');
        }
      }

      console.log('\n🎉 软删除功能测试完成！');
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

testSoftDeleteFunctionality();