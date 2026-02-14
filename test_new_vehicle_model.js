const axios = require('axios');

async function testCreateVehicleModel() {
  try {
    // 首先登录获取token
    console.log('正在登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'  // 使用默认管理员账户
    });

    console.log('登录响应:', loginResponse.data);
    
    if (!loginResponse.data.success) {
      console.error('登录失败');
      return;
    }

    const token = loginResponse.data.data.token; // 或者根据实际响应结构调整
    console.log('获取到token:', token);

    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 测试创建新车型
    console.log('\n正在创建新车型...');
    const newVehicleModel = {
      brand: "测试品牌",
      manufacturer: "测试制造商",
      model_name: "测试型号",
      vehicle_type: "厢式货车",
      production_year: "2024",
      autonomous_level: "L2",
      max_load_capacity: 5000,
      max_volume: 20,
      fuel_type: "柴油",
      engine_displacement: 4.0,
      dimensions_length: 6.2,
      dimensions_width: 2.4,
      dimensions_height: 2.5
    };

    const createResponse = await axios.post(
      'http://localhost:3000/api/admin/vehicle-models',
      newVehicleModel,
      { headers }
    );

    console.log('创建车型响应:', createResponse.data);
    
  } catch (error) {
    console.error('请求失败:', error.response?.data || error.message);
  }
}

testCreateVehicleModel();