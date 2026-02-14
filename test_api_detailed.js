const axios = require('axios');

async function testAPIStepByStep() {
  console.log('🔍 分步测试车型库API...');

  try {
    // 第一步：获取登录token
    console.log('🔐 步骤1: 获取登录token...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ 登录成功，获取到token');
    const token = loginResponse.data.data.token;
    console.log('   Token前20个字符:', token.substring(0, 20) + '...');

    // 第二步：测试一个简单的API端点，确认API服务正常
    console.log('\n🔍 步骤2: 测试简单API端点...');
    try {
      const simpleResponse = await axios.get('http://localhost:3000/health');
      console.log('✅ 健康检查API正常:', simpleResponse.data.status);
    } catch (err) {
      console.error('❌ 偌康检查API异常:', err.message);
      return;
    }

    // 第三步：测试车型库API
    console.log('\n🚚 步骤3: 测试车型库API...');
    const startTime = Date.now();
    
    try {
      const response = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000  // 10秒超时
      });

      const endTime = Date.now();
      console.log(`✅ 车型库API调用成功，耗时: ${endTime - startTime}ms`);
      console.log('📊 响应状态:', response.status);

      if (response.data && response.data.success) {
        console.log('✅ API响应成功');
        
        if (response.data.data && response.data.data.vehicle_models) {
          const models = response.data.data.vehicle_models;
          console.log(`📊 返回车型数量: ${models.length}`);
          
          // 检查新石器车型
          const newStoneModels = models.filter(model => 
            model.brand && model.brand.includes('新石器')
          );
          
          if (newStoneModels.length > 0) {
            console.log('✅ 在API响应中找到新石器车型:');
            newStoneModels.forEach(model => {
              console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}`);
            });
          } else {
            console.log('❌ 在API响应中未找到新石器车型');
            console.log('📋 返回的车型列表:');
            models.forEach(model => {
              console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}`);
            });
          }
        } else {
          console.log('⚠️ API响应中没有车型数据:', response.data);
        }
      } else {
        console.log('❌ API响应失败:', response.data);
      }
    } catch (apiErr) {
      const endTime = Date.now();
      console.error(`❌ 车型库API调用失败，耗时: ${endTime - startTime}ms`);
      console.error('   错误:', apiErr.message);
      if (apiErr.response) {
        console.error('   响应状态:', apiErr.response.status);
        console.error('   响应数据:', apiErr.response.data);
      }
    }
  } catch (error) {
    console.error('❌ 整体测试失败:', error.message);
  }
}

testAPIStepByStep();