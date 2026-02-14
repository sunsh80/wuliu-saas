const axios = require('axios');

// 测试API端点
async function testApi() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 测试车型库API端点...');
  
  try {
    // 首先尝试获取管理员登录
    console.log('\n🔐 尝试管理员登录...');
    const loginResponse = await axios.post(`${baseUrl}/api/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ 登录响应:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log(`🔑 获取到令牌: ${token.substring(0, 20)}...`);
      
      // 使用令牌获取车型列表
      console.log('\n📋 获取车型列表...');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const vehicleResponse = await axios.get(`${baseUrl}/api/admin/vehicle-models`, {
        headers: headers
      });
      
      console.log('✅ 车型列表响应:', vehicleResponse.data);
      
      if (vehicleResponse.data.success && vehicleResponse.data.data) {
        console.log(`\n📊 共获取到 ${vehicleResponse.data.data.vehicle_models.length} 条车型数据`);
        
        if (vehicleResponse.data.data.vehicle_models.length > 0) {
          console.log('\n📋 车型数据示例:');
          vehicleResponse.data.data.vehicle_models.slice(0, 3).forEach((model, index) => {
            console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 类型: ${model.vehicle_type}, 自动驾驶级别: ${model.autonomous_level}`);
          });
        }
      }
    } else {
      console.log('⚠️ 登录失败，尝试直接访问API...');
      
      // 不带认证尝试访问（可能会失败，但可以测试端点是否存在）
      try {
        const vehicleResponse = await axios.get(`${baseUrl}/api/admin/vehicle-models`);
        console.log('✅ 无需认证的车型列表响应:', vehicleResponse.data);
      } catch (error) {
        console.log('❌ 未经认证访问失败（这是正常的）:', error.response?.data || error.message);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到服务器，请确保后端服务正在运行在 http://localhost:3000');
      console.log('💡 请运行: cd backend && node server.js');
    } else {
      console.log('❌ API测试失败:', error.response?.data || error.message);
    }
  }
}

testApi();