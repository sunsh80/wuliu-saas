const axios = require('axios');

async function testVehicleModelsAPI() {
  console.log('🔍 测试车型库API...');

  try {
    // 首先登录获取token
    console.log('🔐 登录管理员账户...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ 登录成功');
    const token = loginResponse.data.data.token;

    // 调用车型API
    console.log('🚚 获取车型列表...');
    const response = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API调用成功');
    console.log('📊 响应状态:', response.status);

    if (response.data.success && response.data.data) {
      const vehicleModels = response.data.data.vehicle_models || [];
      console.log(`📊 返回车型数量: ${vehicleModels.length}`);
      
      // 检查是否包含新石器车型
      const newStoneModels = vehicleModels.filter(model => 
        model.brand.includes('新石器') || model.model_name.includes('新石器')
      );

      if (newStoneModels.length > 0) {
        console.log('✅ 找到新石器车型:');
        newStoneModels.forEach(model => {
          console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}`);
        });
      } else {
        console.log('❌ 未找到新石器车型');
        console.log('📋 所有车型列表:');
        vehicleModels.forEach(model => {
          console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}`);
        });
      }
    } else {
      console.log('❌ API响应格式错误:', response.data);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testVehicleModelsAPI();