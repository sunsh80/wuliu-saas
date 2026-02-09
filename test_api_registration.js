// 测试API端点是否已正确注册
const axios = require('axios');

async function testAPIRegistration() {
  const baseURL = 'http://localhost:3000';
  
  console.log('正在测试API端点注册情况...\n');
  
  // 测试一个已知的端点，确认服务器是否正常运行
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 服务器健康检查通过');
    console.log('   状态:', healthResponse.status);
    console.log('   数据:', healthResponse.data.status);
  } catch (error) {
    console.error('❌ 服务器健康检查失败:', error.message);
    return;
  }
  
  console.log('\n正在测试定价API端点注册情况...');
  
  // 测试平台定价规则API端点
  const pricingEndpoints = [
    { method: 'GET', url: '/api/admin/pricing/rules', desc: '获取平台定价规则列表' },
    { method: 'POST', url: '/api/admin/pricing/rules', desc: '创建平台定价规则' },
    { method: 'GET', url: '/api/admin/pricing/rules/1', desc: '获取单个平台定价规则' },
    { method: 'PUT', url: '/api/admin/pricing/rules/1', desc: '更新平台定价规则' },
    { method: 'DELETE', url: '/api/admin/pricing/rules/1', desc: '删除平台定价规则' },
    { method: 'GET', url: '/api/carrier/pricing/configs', desc: '获取承运商定价配置列表' },
    { method: 'POST', url: '/api/carrier/pricing/configs', desc: '创建承运商定价配置' },
    { method: 'GET', url: '/api/carrier/pricing/configs/1', desc: '获取单个承运商定价配置' },
    { method: 'PUT', url: '/api/carrier/pricing/configs/1', desc: '更新承运商定价配置' },
    { method: 'DELETE', url: '/api/carrier/pricing/configs/1', desc: '删除承运商定价配置' }
  ];
  
  for (const endpoint of pricingEndpoints) {
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${baseURL}${endpoint.url}`, {
          validateStatus: function (status) {
            // 接受所有状态码，因为我们只是测试端点是否存在
            return status < 500; // 不将4xx视为错误，只将5xx视为错误
          }
        });
      } else if (endpoint.method === 'POST') {
        response = await axios.post(`${baseURL}${endpoint.url}`, {}, {
          validateStatus: function (status) {
            return status < 500;
          }
        });
      } else if (endpoint.method === 'PUT') {
        response = await axios.put(`${baseURL}${endpoint.url}`, {}, {
          validateStatus: function (status) {
            return status < 500;
          }
        });
      } else if (endpoint.method === 'DELETE') {
        response = await axios.delete(`${baseURL}${endpoint.url}`, {
          validateStatus: function (status) {
            return status < 500;
          }
        });
      }
      
      if (response.status === 404) {
        console.log(`❌ ${endpoint.desc} - 端点未找到 (404)`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`✅ ${endpoint.desc} - 端点已注册，需要认证 (${response.status})`);
      } else if (response.status === 405) {
        console.log(`✅ ${endpoint.desc} - 端点已注册，方法不允许 (${response.status})`);
      } else {
        console.log(`✅ ${endpoint.desc} - 端点已注册 (${response.status})`);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log(`❌ ${endpoint.desc} - 端点未找到 (404)`);
        } else if (error.response.status === 401 || error.response.status === 403) {
          console.log(`✅ ${endpoint.desc} - 端点已注册，需要认证 (${error.response.status})`);
        } else if (error.response.status === 405) {
          console.log(`✅ ${endpoint.desc} - 端点已注册，方法不允许 (${error.response.status})`);
        } else {
          console.log(`✅ ${endpoint.desc} - 端点已注册 (${error.response.status})`);
        }
      } else {
        console.log(`❌ ${endpoint.desc} - 网络错误或端点不可达`);
      }
    }
  }
  
  console.log('\nAPI端点注册测试完成！');
  console.log('\n如果大部分端点显示"端点已注册"，说明API路由已正确配置。');
  console.log('401/403错误表示端点存在但需要认证。');
  console.log('404错误表示端点未注册或路径错误。');
}

testAPIRegistration();