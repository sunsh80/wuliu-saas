/**
 * 测试新石器车型 API 访问
 */

const axios = require('axios');

async function testNewstoneVehicles() {
  try {
    console.log('开始测试新石器车型 API 访问...\n');
    
    // 测试获取车型库列表 API
    console.log('1. 测试获取车型库列表 API...');
    const response = await axios.get('http://localhost:3000/api/admin/vehicle-models', {
      headers: {
        'Cookie': 'connect.sid=some_valid_session_id' // 这里需要一个有效的会话ID
      }
    });
    
    if (response.data && response.data.data && response.data.data.vehicle_models) {
      const newstoneModels = response.data.data.vehicle_models.filter(model => 
        model.brand === '新石器' || model.manufacturer.includes('新石器')
      );
      
      console.log(`找到 ${newstoneModels.length} 个新石器车型:`);
      newstoneModels.forEach(model => {
        console.log(`  - ${model.model_name} (${model.vehicle_type}): ${model.max_load_capacity}kg, ${model.autonomous_level}`);
      });
    } else {
      console.log('未能获取车型列表数据');
    }
    
    console.log('\n2. 测试完成');
    
  } catch (error) {
    if (error.response) {
      // 服务器响应了错误状态码
      console.log(`API 请求失败: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('可能需要有效的管理员会话才能访问车型库 API');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.log('无法连接到服务器，请确保后端服务正在运行');
    } else {
      // 其他错误
      console.log('请求配置错误:', error.message);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNewstoneVehicles();
}

module.exports = testNewstoneVehicles;