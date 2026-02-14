const axios = require('axios');

async function testCreateVehicleModel() {
  try {
    // 首先尝试登录获取token
    console.log('正在尝试登录...');
    let token;
    
    try {
      // 尝试使用默认管理员账户登录
      const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      console.log('登录响应:', loginResponse.data);
      if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
        token = loginResponse.data.data.token;
      } else if (loginResponse.data.success && loginResponse.headers['set-cookie']) {
        // 如果token在cookie中
        console.log('登录成功，检查cookie...');
      }
    } catch (loginError) {
      console.error('登录失败:', loginError.response?.data || loginError.message);
      // 如果登录失败，尝试使用已有的session
      console.log('尝试使用浏览器中已保存的session...');
      // 这里需要从浏览器获取session信息
    }
    
    // 如果没有token，尝试直接请求（假设session已存在）
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 如果有token，添加到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
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
      fuel_type: "柴油"
    };

    console.log('请求数据:', newVehicleModel);
    
    const createResponse = await axios.post(
      'http://localhost:3000/api/admin/vehicle-models',
      newVehicleModel,
      { 
        headers,
        validateStatus: function (status) {
          return status < 500; // 接受小于500的状态码，这样可以获取错误响应
        }
      }
    );

    console.log('创建车型响应状态:', createResponse.status);
    console.log('创建车型响应数据:', createResponse.data);
    
  } catch (error) {
    console.error('请求失败:', error.response?.data || error.message);
    console.error('响应状态:', error.response?.status);
  }
}

testCreateVehicleModel();