const axios = require('axios');

async function testPricingAPIs() {
  const baseURL = 'http://localhost:3000';
  
  console.log('开始测试定价API端点...\n');
  
  try {
    // 测试获取平台定价规则列表（需要管理员权限）
    console.log('1. 测试获取平台定价规则列表...');
    try {
      const response = await axios.get(`${baseURL}/api/admin/pricing/rules`, {
        headers: {
          'Cookie': 'connect.sid=s:admin_session_token', // 管理员会话令牌
          'Content-Type': 'application/json'
        }
      });
      console.log('   ✅ 端点可达，状态码:', response.status);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log('   ⚠️ 端点可达但需要管理员认证');
        } else {
          console.log('   ❌ 端点响应错误，状态码:', error.response.status);
        }
      } else {
        console.log('   ❌ 网络错误或端点不可达');
      }
    }

    // 测试获取承运商定价配置列表（需要承运商权限）
    console.log('\n2. 测试获取承运商定价配置列表...');
    try {
      const response = await axios.get(`${baseURL}/api/carrier/pricing/configs`, {
        headers: {
          'Cookie': 'connect.sid=carrier_session_token', // 承运商会话令牌
          'Content-Type': 'application/json'
        }
      });
      console.log('   ✅ 端点可达，状态码:', response.status);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log('   ⚠️ 端点可达但需要承运商认证');
        } else {
          console.log('   ❌ 端点响应错误，状态码:', error.response.status);
        }
      } else {
        console.log('   ❌ 网络错误或端点不可达');
      }
    }

    console.log('\nAPI端点测试完成！');
    console.log('\n要使用Postman进行完整测试，请:');
    console.log('1. 导入openapi.yaml文件到Postman');
    console.log('2. 配置正确的服务器地址 (http://localhost:3000)');
    console.log('3. 获取有效的管理员或承运商标识令牌');
    console.log('4. 按照CRUD顺序测试各个端点');
    console.log('\nAPI端点清单:');
    console.log('  GET    /api/admin/pricing/rules     - 获取平台定价规则列表');
    console.log('  POST   /api/admin/pricing/rules     - 创建平台定价规则');
    console.log('  GET    /api/admin/pricing/rules/{id} - 获取单个平台定价规则');
    console.log('  PUT    /api/admin/pricing/rules/{id} - 更新平台定价规则');
    console.log('  DELETE /api/admin/pricing/rules/{id} - 删除平台定价规则');
    console.log('  GET    /api/carrier/pricing/configs  - 获取承运商定价配置列表');
    console.log('  POST   /api/carrier/pricing/configs  - 创建承运商定价配置');
    console.log('  GET    /api/carrier/pricing/configs/{id} - 获取单个承运商定价配置');
    console.log('  PUT    /api/carrier/pricing/configs/{id} - 更新承运商定价配置');
    console.log('  DELETE /api/carrier/pricing/configs/{id} - 删除承运商定价配置');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 运行测试
testPricingAPIs();