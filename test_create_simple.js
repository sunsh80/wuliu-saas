const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000';

// 存储认证令牌
let authToken = '';

async function testCreateVehicleModel() {
  console.log('🔍 开始测试创建车型功能...\n');
  
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
    
    // 2. 准备测试数据（简化版）
    console.log('🆕 步骤2: 准备测试数据');
    const newVehicleModel = {
      brand: '测试品牌',
      manufacturer: '测试制造商',
      model_name: '测试型号CRUD',
      vehicle_type: '厢式货车',
      production_year: '2025',
      autonomous_level: 'L3',
      max_load_capacity: 2000,
      max_volume: 15.5,
      fuel_type: '电动'
    };
    
    console.log('📝 测试数据准备就绪:', JSON.stringify(newVehicleModel, null, 2));
    
    // 3. 创建新车型
    console.log('\n🔄 步骤3: 发送创建车型请求');
    try {
      const createResponse = await axios.post(`${BASE_URL}/api/admin/vehicle-models`, newVehicleModel, {
        headers: { 
          'Authorization': `Bearer ${authToken}`, 
          'Content-Type': 'application/json' 
        },
        timeout: 10000 // 设置10秒超时
      });
      
      console.log('✅ 创建车型成功');
      console.log('响应数据:', JSON.stringify(createResponse.data, null, 2));
      
      if (createResponse.data.success && createResponse.data.data && createResponse.data.data.id) {
        const createdId = createResponse.data.data.id;
        console.log(`\n✅ 成功创建车型，ID: ${createdId}`);
        
        // 4. 获取并验证新增的车型
        console.log('\n🔍 步骤4: 验证新增车型');
        const getResponse = await axios.get(`${BASE_URL}/api/admin/vehicle-models/${createdId}`, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            timeout: 5000
          }
        });
        
        if (getResponse.data.success) {
          console.log('✅ 获取车型详情成功');
          console.log(`   - ID: ${getResponse.data.data.id}`);
          console.log(`   - 品牌: ${getResponse.data.data.brand}`);
          console.log(`   - 型号: ${getResponse.data.data.model_name}`);
        } else {
          console.error('❌ 获取车型详情失败');
        }
      } else {
        console.error('❌ 创建响应格式不正确');
      }
    } catch (createError) {
      console.error('❌ 创建车型失败:', createError.message);
      if (createError.response) {
        console.error('响应状态:', createError.response.status);
        console.error('响应数据:', createError.response.data);
      }
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testCreateVehicleModel();