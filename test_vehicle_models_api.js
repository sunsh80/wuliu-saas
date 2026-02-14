const axios = require('axios');

async function testApi() {
  try {
    console.log('🔍 测试车型库API...');
    
    const response = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    console.log('✅ API响应成功');
    console.log('📊 响应状态:', response.status);
    console.log('📝 响应数据:');
    
    const data = response.data;
    console.log(JSON.stringify(data, null, 2)); // 以格式化的方式输出JSON
    
    if (data.success && data.data && data.data.vehicle_models) {
      console.log(`\n📈 成功获取 ${data.data.vehicle_models.length} 条车型数据`);
      
      // 显示前两条车型数据
      data.data.vehicle_models.slice(0, 2).forEach((model, index) => {
        console.log(`\n${index + 1}. 车型信息:`);
        console.log(`   ID: ${model.id}`);
        console.log(`   品牌: ${model.brand}`);
        console.log(`   制造商: ${model.manufacturer}`);
        console.log(`   型号: ${model.model_name}`);
        console.log(`   车辆类型: ${model.vehicle_type}`);
        console.log(`   自动驾驶级别: ${model.autonomous_level}`);
        console.log(`   最大载重: ${model.max_load_capacity} kg`);
        console.log(`   最大容量: ${model.max_volume} m³`);
      });
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testApi();