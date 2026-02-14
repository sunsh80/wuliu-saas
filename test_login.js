const axios = require('axios');

async function testLogin() {
  console.log('🧪 开始测试登录功能...\n');
  
  // 测试管理员登录
  console.log('🔐 测试管理员登录...');
  try {
    const adminResponse = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ 管理员登录成功!');
    console.log('   - 响应状态:', adminResponse.status);
    console.log('   - 响应数据:', JSON.stringify(adminResponse.data, null, 2));
    
    if (adminResponse.data.success && adminResponse.data.data && adminResponse.data.data.token) {
      console.log('✅ 管理员登录响应格式正确\n');
    } else {
      console.log('⚠️ 管理员登录响应格式可能有问题\n');
    }
  } catch (error) {
    console.log('❌ 管理员登录失败:', error.response?.data || error.message);
  }
  
  // 测试租户登录
  console.log('👥 测试租户登录...');
  try {
    const tenantResponse = await axios.post('http://localhost:3000/api/tenant-web/login', {
      email: '6234567@163.com',  // 使用数据库中存在的账户
      password: '123456'  // 使用默认密码
    });
    
    console.log('✅ 租户登录成功!');
    console.log('   - 响应状态:', tenantResponse.status);
    console.log('   - 响应数据:', JSON.stringify(tenantResponse.data, null, 2));
    
    if (tenantResponse.data.success && tenantResponse.data.data && tenantResponse.data.data.token) {
      console.log('✅ 租户登录响应格式正确\n');
    } else {
      console.log('⚠️ 租户登录响应格式可能有问题\n');
    }
  } catch (error) {
    console.log('❌ 租户登录失败:', error.response?.data || error.message);
  }
  
  console.log('\n📋 测试完成!');
}

// 检查后端是否运行
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ 后端服务运行正常:', response.data);
    return true;
  } catch (error) {
    console.log('❌ 后端服务未运行或无法访问:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 检查后端服务状态...');
  const backendRunning = await checkBackend();
  
  if (backendRunning) {
    await testLogin();
  } else {
    console.log('\n💡 提示: 请先启动后端服务 (cd backend && npm start)，然后重新运行此测试。');
  }
}

main();