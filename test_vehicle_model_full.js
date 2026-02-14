const axios = require('axios');

async function testVehicleModelAPI() {
  try {
    console.log('=== 车型管理API测试 ===\n');
    
    // 1. 首先登录获取token
    console.log('1. 尝试登录...');
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      if (loginResponse.data.success && loginResponse.data.data?.token) {
        token = loginResponse.data.data.token;
        console.log('✓ 登录成功');
      } else {
        console.log('✗ 登录失败:', loginResponse.data);
        return;
      }
    } catch (loginError) {
      console.log('✗ 登录失败:', loginError.response?.data || loginError.message);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. 获取现有车型列表
    console.log('\n2. 获取现有车型列表...');
    try {
      const listResponse = await axios.get('http://localhost:3000/api/admin/vehicle-models', { headers });
      console.log('✓ 获取车型列表成功，当前有', listResponse.data.data?.vehicle_models?.length || 0, '个车型');
    } catch (listError) {
      console.log('✗ 获取车型列表失败:', listError.response?.data || listError.message);
    }

    // 3. 创建新车型
    console.log('\n3. 创建新车型...');
    const newVehicleModel = {
      brand: "测试品牌",
      manufacturer: "测试制造商",
      model_name: "测试型号-TMP-" + Date.now(), // 使用时间戳确保唯一性
      vehicle_type: "厢式货车",
      production_year: "2024",
      autonomous_level: "L2",
      max_load_capacity: 5000,
      max_volume: 20,
      fuel_type: "柴油",
      engine_displacement: 4.0,
      dimensions_length: 6.2,
      dimensions_width: 2.4,
      dimensions_height: 2.5,
      wheelbase: 3.8,
      max_speed: 120,
      fuel_efficiency: 8.5
    };

    try {
      console.log('发送数据:', newVehicleModel);
      const createResponse = await axios.post(
        'http://localhost:3000/api/admin/vehicle-models',
        newVehicleModel,
        { headers }
      );
      
      console.log('✓ 创建车型成功:', createResponse.data);
      const createdModel = createResponse.data.data;
      
      // 4. 更新刚创建的车型
      console.log('\n4. 更新车型信息...');
      const updatedData = {
        ...newVehicleModel,
        model_name: "更新后的测试型号-TMP-" + Date.now(),
        max_load_capacity: 6000
      };
      
      try {
        const updateResponse = await axios.put(
          `http://localhost:3000/api/admin/vehicle-models/${createdModel.id}`,
          updatedData,
          { headers }
        );
        
        console.log('✓ 更新车型成功:', updateResponse.data);
      } catch (updateError) {
        console.log('✗ 更新车型失败:', updateError.response?.data || updateError.message);
      }
      
      // 5. 获取单个车型详情
      console.log('\n5. 获取车型详情...');
      try {
        const detailResponse = await axios.get(
          `http://localhost:3000/api/admin/vehicle-models/${createdModel.id}`,
          { headers }
        );
        
        console.log('✓ 获取车型详情成功:', {
          id: detailResponse.data.data.id,
          model_name: detailResponse.data.data.model_name,
          brand: detailResponse.data.data.brand
        });
      } catch (detailError) {
        console.log('✗ 获取车型详情失败:', detailError.response?.data || detailError.message);
      }
      
    } catch (createError) {
      console.log('✗ 创建车型失败:', createError.response?.data || createError.message);
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

testVehicleModelAPI();