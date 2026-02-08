// 测试API返回的租户数据
const axios = require('axios');

async function testTenantAPI() {
  console.log('🔍 测试租户API返回的数据...\n');
  
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
      
      console.log('\n👥 尝试获取所有租户数据...');
      const tenantsResponse = await axios.get('http://localhost:3000/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 租户API调用成功!');
      console.log('📋 租户数据:', JSON.stringify(tenantsResponse.data, null, 2));
      
      // 检查哪些租户有carrier角色
      console.log('\n🔍 检查哪些租户有carrier角色:');
      if (tenantsResponse.data.data && tenantsResponse.data.data.tenants) {
        tenantsResponse.data.data.tenants.forEach(tenant => {
          let hasCarrierRole = false;
          
          if (typeof tenant.roles === 'string') {
            try {
              const rolesArray = JSON.parse(tenant.roles);
              hasCarrierRole = Array.isArray(rolesArray) && rolesArray.includes('carrier');
            } catch (e) {
              console.warn('解析roles失败:', e);
            }
          } else if (Array.isArray(tenant.roles)) {
            hasCarrierRole = tenant.roles.includes('carrier');
          }
          
          console.log(`  - ID: ${tenant.id}, Name: ${tenant.name}, Roles: ${tenant.roles}, Has Carrier: ${hasCarrierRole}`);
        });
      }
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
testTenantAPI();