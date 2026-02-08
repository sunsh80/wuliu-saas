// 测试报表统计API端点
const axios = require('axios');

async function testReportsAPI() {
  console.log('🔍 测试报表统计API端点...\n');
  
  try {
    // 首先尝试获取管理员token
    console.log('🔐 尝试获取管理员登录token...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 管理员登录成功');
      const token = loginResponse.data.data.token;
      
      console.log('\n📊 尝试获取报表统计数据...');
      const reportsResponse = await axios.get('http://localhost:3000/api/admin/reports/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 报表统计API调用成功!');
      console.log('📋 响应数据:', JSON.stringify(reportsResponse.data, null, 2));
    } else {
      console.log('❌ 管理员登录失败:', loginResponse.data);
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ API请求失败:', error.response.status, error.response.statusText);
      console.log('📋 响应数据:', error.response.data);
    } else if (error.request) {
      console.log('❌ 无法连接到服务器，请确保后端服务正在运行');
      console.log('💡 运行命令: cd backend && node server.js');
    } else {
      console.log('❌ 请求配置错误:', error.message);
    }
  }
}

// 运行测试
testReportsAPI();