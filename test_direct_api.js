// 简单的API测试，绕过OpenAPI验证
const http = require('http');

// 创建一个简单的请求函数
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testDirectAPI() {
  console.log('🔍 直接测试后端API...');

  try {
    // 首先登录获取session
    console.log('🔐 登录新石器承运商账户...');
    
    // 使用http模块模拟登录
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tenant-web/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', async () => {
        console.log('Login response:', data);
        
        // 获取Set-Cookie头
        const cookies = res.headers['set-cookie'];
        if (cookies) {
          const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
          if (sessionCookie) {
            console.log('✅ 获取到会话cookie');
            
            // 使用会话cookie请求车型API
            const apiOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/tenant-web/vehicles/available-models',
              method: 'GET',
              headers: {
                'Cookie': sessionCookie.split(';')[0], // 只取cookie名称和值部分
                'Content-Type': 'application/json'
              }
            };
            
            try {
              const apiResponse = await makeRequest(apiOptions);
              console.log('车型API响应:', JSON.stringify(apiResponse, null, 2));
            } catch (apiError) {
              console.error('车型API请求失败:', apiError.message);
            }
          } else {
            console.log('❌ 未获取到会话cookie');
          }
        }
      });
    });

    loginReq.write(JSON.stringify({
      email: 'contact@newstone.ai',
      password: 'newstone123'
    }));

    loginReq.on('error', (e) => {
      console.error('登录请求失败:', e.message);
    });

    loginReq.end();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDirectAPI();