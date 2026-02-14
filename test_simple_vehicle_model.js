const axios = require('axios');

async function testSimpleCreate() {
  try {
    console.log('=== 简化车型创建测试 ===\n');
    
    // 登录
    console.log('1. 登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 尝试创建一个最简单的车型
    console.log('2. 创建最简单的车型...');
    const simpleModel = {
      brand: "测试品牌",
      manufacturer: "测试制造商", 
      model_name: "简单测试型号-" + Date.now(),
      vehicle_type: "厢式货车",
      autonomous_level: "L2"
    };
    
    console.log('发送数据:', simpleModel);
    
    const startTime = Date.now();
    console.log('开始时间:', new Date(startTime).toISOString());
    
    const createResponse = await axios.post(
      'http://localhost:3000/api/admin/vehicle-models',
      simpleModel,
      { 
        headers,
        timeout: 10000  // 10秒超时
      }
    );
    
    const endTime = Date.now();
    console.log('结束时间:', new Date(endTime).toISOString());
    console.log('耗时:', (endTime - startTime), '毫秒');
    
    console.log('✓ 创建成功:', createResponse.data);
    
  } catch (error) {
    const endTime = Date.now();
    console.log('结束时间:', new Date(endTime).toISOString());
    console.log('请求失败:', error.message);
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
}

testSimpleCreate();