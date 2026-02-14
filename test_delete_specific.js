const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000';

// 存储认证令牌
let authToken = '';

async function testDeleteSpecificModel() {
  console.log('🔍 开始测试删除特定车型...\n');

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

    // 2. 获取车型列表，找到一个未被使用的车型进行测试
    console.log('📚 步骤2: 获取车型列表');
    const listResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (listResponse.data.success) {
      console.log(`✅ 获取到 ${listResponse.data.data.vehicle_models.length} 条车型数据`);
      
      // 查找一个可能是测试用的车型
      const testModels = listResponse.data.data.vehicle_models.filter(model => 
        model.brand.includes('测试') || model.model_name.includes('测试')
      );
      
      if (testModels.length > 0) {
        const modelToDelete = testModels[0]; // 选择第一个测试车型
        console.log(`🎯 选择车型进行删除测试: ID ${modelToDelete.id}, 品牌: ${modelToDelete.brand}`);
        
        // 3. 尝试删除这个车型
        console.log('🗑️ 步骤3: 删除选定的车型');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/vehicle-models/${modelToDelete.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (deleteResponse.data.success) {
            console.log('✅ 车型删除成功');
            console.log(`   - 消息: ${deleteResponse.data.message}`);
          } else {
            console.error('❌ 车型删除失败:', deleteResponse.data.message);
            if (deleteResponse.data.error === 'MODEL_IN_USE') {
              console.log('   - 提示: 车型正在被使用，无法删除');
            }
          }
        } catch (deleteError) {
          console.error('❌ 删除请求失败:', deleteError.response?.data || deleteError.message);
        }
      } else {
        console.log('⚠️  未找到测试车型，使用ID 14进行测试');
        // 使用已知的ID进行测试
        const modelId = 14;
        
        // 3. 尝试删除这个车型
        console.log('🗑️ 步骤3: 删除ID为14的车型');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/vehicle-models/${modelId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (deleteResponse.data.success) {
            console.log('✅ 车型删除成功');
            console.log(`   - 消息: ${deleteResponse.data.message}`);
          } else {
            console.error('❌ 车型删除失败:', deleteResponse.data.message);
            if (deleteResponse.data.error === 'MODEL_IN_USE') {
              console.log('   - 提示: 车型正在被使用，无法删除');
            }
          }
        } catch (deleteError) {
          console.error('❌ 删除请求失败:', deleteError.response?.data || deleteError.message);
        }
      }
    } else {
      console.error('❌ 获取车型列表失败');
    }

    console.log('\n🎉 删除功能测试完成！');
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDeleteSpecificModel();