const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 测试登录API...');
    
    // 使用测试账户登录
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ 登录成功');
    console.log('📝 登录响应:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      console.log('\n🔍 使用令牌测试车型库API...');
      
      const vehicleResponse = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ 车型库API访问成功');
      console.log(`📊 获取到 ${vehicleResponse.data.data.vehicle_models.length} 条车型数据`);
      
      // 显示第一条车型数据
      if (vehicleResponse.data.data.vehicle_models.length > 0) {
        const firstModel = vehicleResponse.data.data.vehicle_models[0];
        console.log('\n📋 第一条车型数据:');
        console.log(`   ID: ${firstModel.id}`);
        console.log(`   品牌: ${firstModel.brand}`);
        console.log(`   型号: ${firstModel.model_name}`);
        console.log(`   类型: ${firstModel.vehicle_type}`);
      }
    } else {
      console.log('⚠️ 登录响应格式不符合预期');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testLogin();