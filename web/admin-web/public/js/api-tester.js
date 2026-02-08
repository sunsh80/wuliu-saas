// 前端API连接测试工具
// 用于验证前端与后端的连接状态

class ApiConnectionTester {
  constructor() {
    this.backendUrl = 'http://localhost:3000';
    this.apiBase = '/api';
    this.testResults = {};
  }

  // 测试后端服务器连通性
  async testBackendConnectivity() {
    console.log('Testing backend connectivity...');
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        mode: 'cors' // 明确指定CORS模式
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.testResults.backendConnectivity = {
          success: true,
          responseTime: responseTime,
          status: data.status || 'OK',
          statusCode: response.status
        };
        console.log('✅ Backend connectivity test passed');
        return true;
      } else {
        this.testResults.backendConnectivity = {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        };
        console.error('❌ Backend connectivity test failed:', response.status);
        return false;
      }
    } catch (error) {
      this.testResults.backendConnectivity = {
        success: false,
        error: error.message
      };
      console.error('❌ Backend connectivity test failed:', error.message);
      return false;
    }
  }

  // 测试前端代理配置
  async testFrontendProxy() {
    console.log('Testing frontend proxy configuration...');
    
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health', {
        method: 'GET'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.testResults.frontendProxy = {
          success: true,
          responseTime: responseTime,
          status: data.status || 'OK',
          statusCode: response.status
        };
        console.log('✅ Frontend proxy test passed');
        return true;
      } else {
        this.testResults.frontendProxy = {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        };
        console.error('❌ Frontend proxy test failed:', response.status);
        return false;
      }
    } catch (error) {
      this.testResults.frontendProxy = {
        success: false,
        error: error.message
      };
      console.error('❌ Frontend proxy test failed:', error.message);
      return false;
    }
  }

  // 测试登录API
  async testLoginApi() {
    console.log('Testing login API endpoint...');
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'OPTIONS', // 使用OPTIONS方法检查端点是否存在
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.testResults.loginApi = {
        success: response.status !== 404,
        statusCode: response.status
      };
      
      if (response.status !== 404) {
        console.log('✅ Login API endpoint is accessible');
        return true;
      } else {
        console.error('❌ Login API endpoint not found');
        return false;
      }
    } catch (error) {
      this.testResults.loginApi = {
        success: false,
        error: error.message
      };
      console.error('❌ Login API test failed:', error.message);
      return false;
    }
  }

  // 运行完整测试
  async runCompleteTest() {
    console.log('🚀 Starting API connection test...');
    
    const results = {
      backendConnectivity: await this.testBackendConnectivity(),
      frontendProxy: await this.testFrontendProxy(),
      loginApi: await this.testLoginApi()
    };
    
    console.log('📋 Test Results:', this.testResults);
    
    // 输出摘要
    console.log('\n📊 Test Summary:');
    console.log(`Backend Connectivity: ${results.backendConnectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Frontend Proxy: ${results.frontendProxy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Login API: ${results.loginApi ? '✅ PASS' : '❌ FAIL'}`);
    
    // 提供建议
    if (!results.backendConnectivity) {
      console.log('\n💡 Backend Connectivity Issue:');
      console.log('  - Check if backend service is running on http://localhost:3000');
      console.log('  - Verify firewall settings');
      console.log('  - Check backend service logs');
    }
    
    if (!results.frontendProxy) {
      console.log('\n💡 Frontend Proxy Issue:');
      console.log('  - Verify vite.config.js proxy settings');
      console.log('  - Restart frontend development server');
      console.log('  - Check CORS configuration on backend');
    }
    
    if (!results.loginApi) {
      console.log('\n💡 Login API Issue:');
      console.log('  - Verify backend API routes are defined');
      console.log('  - Check if login endpoint exists');
      console.log('  - Review backend API documentation');
    }
    
    return results;
  }

  // 获取测试结果
  getResults() {
    return this.testResults;
  }
}

// 创建全局实例以便在控制台中使用
window.apiTester = new ApiConnectionTester();

// 提供便捷的测试函数
window.runApiTest = async () => {
  return await window.apiTester.runCompleteTest();
};

console.log('🔧 API Connection Tester loaded. Use `runApiTest()` to start testing.');
console.log('   Or access individual methods via `apiTester` object.');