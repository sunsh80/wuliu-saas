/**
 * 测试车型模型API
 */
const axios = require('axios');

async function testApi() {
  try {
    console.log('🔍 测试车型模型API...');

    // 测试获取车型列表
    console.log('\n📋 测试获取车型列表...');
    const response = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
      withCredentials: true, // 包含cookies
    });

    console.log('✅ 响应状态:', response.status);
    console.log('✅ 响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data && response.data.data.vehicle_models) {
      console.log(`\n📈 成功获取 ${response.data.data.vehicle_models.length} 条车型数据`);
      console.log('📋 前两条车型数据:');
      response.data.data.vehicle_models.slice(0, 2).forEach((model, index) => {
        console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand}, 车型名称: ${model.model_name}, 类型: ${model.vehicle_type}`);
      });
    } else {
      console.log('❌ API响应格式不符合预期');
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

testApi();