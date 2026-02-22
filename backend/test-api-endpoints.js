/**
 * API 端点测试脚本
 * 测试所有 28 个 handler 对应的 API 端点
 * 
 * 使用方法:
 * node backend/test-api-endpoints.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试用例配置
const testCases = [
  // ========== Admin - Commission 抽佣管理 ==========
  {
    name: '获取佣金配置',
    handler: 'getCommissionConfig',
    method: 'GET',
    path: '/api/admin/commissions/config',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '佣金记录列表',
    handler: 'listCommissionRecords',
    method: 'GET',
    path: '/api/admin/commissions/records',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Admin - Settings 设置管理 ==========
  {
    name: '设置列表',
    handler: 'listSettings',
    method: 'GET',
    path: '/api/admin/settings',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '系统设置列表',
    handler: 'listSystemSettings',
    method: 'GET',
    path: '/api/admin/system-settings',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '服务提供商列表',
    handler: 'listServiceProviders',
    method: 'GET',
    path: '/api/admin/service-providers',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Admin - Vehicle Models 车型管理 ==========
  {
    name: '车型列表',
    handler: 'createVehicleModel',
    method: 'GET',
    path: '/api/admin/vehicle-models',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Admin - Vehicle Tracking 车辆追踪 ==========
  {
    name: '获取最新位置',
    handler: 'getLatestPositions',
    method: 'GET',
    path: '/api/admin/vehicle-tracking/latest-positions',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '获取车辆位置',
    handler: 'getVehiclePositions',
    method: 'GET',
    path: '/api/admin/vehicle-tracking/positions?vehicleId=1',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Admin - Violations 违规管理 ==========
  {
    name: '违规列表',
    handler: 'listViolations',
    method: 'GET',
    path: '/api/admin/violations',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '获取违规统计',
    handler: 'getViolationStats',
    method: 'GET',
    path: '/api/admin/violations/stats',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Admin - Stop Points 停靠点管理 ==========
  {
    name: '待审批停靠点列表',
    handler: 'adminListPendingStopPoints',
    method: 'GET',
    path: '/api/admin/stop-points/pending',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '停靠点列表',
    handler: 'adminListStopPoints',
    method: 'GET',
    path: '/api/admin/stop-points',
    needAuth: true,
    role: 'admin'
  },
  {
    name: '获取停靠点详情',
    handler: 'adminGetStopPoint',
    method: 'GET',
    path: '/api/admin/stop-points/1',
    needAuth: true,
    role: 'admin'
  },
  
  // ========== Carrier - Orders 订单管理 ==========
  {
    name: '承运商订单列表',
    handler: 'listCarrierOrders',
    method: 'GET',
    path: '/api/carrier/orders',
    needAuth: true,
    role: 'carrier'
  },
  
  // ========== Tenant - Stop Points 停靠点管理 ==========
  {
    name: '我的停靠点列表',
    handler: 'tenantListMyStopPoints',
    method: 'GET',
    path: '/api/tenant/stop-points',
    needAuth: true,
    role: 'tenant'
  },
  {
    name: '获取我的停靠点',
    handler: 'tenantGetMyStopPoint',
    method: 'GET',
    path: '/api/tenant/stop-points/1',
    needAuth: true,
    role: 'tenant'
  },
  
  // ========== Public/Health 健康检查 ==========
  {
    name: '健康检查',
    handler: 'healthCheck',
    method: 'GET',
    path: '/health',
    needAuth: false
  },
  {
    name: 'API 健康检查',
    handler: 'healthCheck',
    method: 'GET',
    path: '/api/admin/health',
    needAuth: false
  }
];

// 模拟 Session Cookie
const COOKIES = {
  admin: 'connect.sid=s%3Aadmin_test_session_id_for_testing',
  carrier: 'connect.sid=s%3Acarrier_test_session_id_for_testing',
  tenant: 'connect.sid=s%3Atenant_test_session_id_for_testing'
};

/**
 * 发送 HTTP 请求
 */
function request(method, path, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时 (10s)'));
    });
    req.end();
  });
}

/**
 * 运行测试
 */
async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 API 端点测试开始');
  console.log('='.repeat(70));
  console.log(`基准 URL: ${BASE_URL}`);
  console.log(`测试用例：${testCases.length} 个`);
  console.log('='.repeat(70));
  console.log();
  
  const results = {
    passed: 0,
    failed: 0,
    authFailed: 0,
    timeout: 0,
    details: []
  };
  
  for (const tc of testCases) {
    const cookie = tc.needAuth ? COOKIES[tc.role] : null;
    const authDesc = tc.needAuth ? `🔐 [${tc.role}]` : '🔓 [公开]';
    
    process.stdout.write(`测试：${tc.name} ${authDesc} ... `);
    
    try {
      const res = await request(tc.method, tc.path, cookie);
      
      // 判断测试结果
      let status = '✅ PASS';
      let statusType = 'passed';
      
      if (res.statusCode === 401 || (res.body && res.body.error === 'UNAUTHORIZED')) {
        status = '⚠️  AUTH_FAIL';
        statusType = 'authFailed';
      } else if (res.statusCode >= 500) {
        status = '❌ FAIL';
        statusType = 'failed';
      } else if (res.statusCode === 404) {
        status = '❓ 404';
        statusType = 'failed';
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        status = '✅ PASS';
        statusType = 'passed';
      } else {
        status = '⚠️  WARN';
        statusType = 'passed';
      }
      
      results[statusType]++;
      results.details.push({
        name: tc.name,
        handler: tc.handler,
        method: tc.method,
        path: tc.path,
        statusCode: res.statusCode,
        status: status,
        statusType: statusType
      });
      
      console.log(`${status} [${res.statusCode}]`);
      
      // 如果是认证失败，打印详细信息
      if (statusType === 'authFailed') {
        console.log(`      → 认证失败，需要检查 Session 或 Token`);
      }
      
    } catch (err) {
      results.failed++;
      results.details.push({
        name: tc.name,
        handler: tc.handler,
        method: tc.method,
        path: tc.path,
        statusCode: 0,
        status: '❌ ERROR',
        statusType: 'failed',
        error: err.message
      });
      console.log(`❌ ERROR: ${err.message}`);
    }
  }
  
  // 打印汇总报告
  console.log();
  console.log('='.repeat(70));
  console.log('📊 测试汇总报告');
  console.log('='.repeat(70));
  console.log(`总用例数：${testCases.length}`);
  console.log(`✅ 通过：${results.passed}`);
  console.log(`⚠️  认证失败：${results.authFailed}`);
  console.log(`❌ 失败：${results.failed}`);
  console.log(`⏱️  超时：${results.timeout}`);
  console.log('='.repeat(70));
  
  // 打印失败详情
  const failedTests = results.details.filter(d => d.statusType === 'failed' || d.statusType === 'authFailed');
  if (failedTests.length > 0) {
    console.log();
    console.log('⚠️  失败/认证失败详情:');
    console.log('-'.repeat(70));
    failedTests.forEach(t => {
      console.log(`  ${t.status} ${t.name}`);
      console.log(`     Handler: ${t.handler}`);
      console.log(`     ${t.method} ${t.path}`);
      console.log(`     状态码：${t.statusCode}`);
      if (t.error) console.log(`     错误：${t.error}`);
      console.log();
    });
  }
  
  // 打印成功详情
  const passedTests = results.details.filter(d => d.statusType === 'passed');
  if (passedTests.length > 0) {
    console.log();
    console.log('✅ 通过详情:');
    console.log('-'.repeat(70));
    passedTests.forEach(t => {
      console.log(`  ${t.status} ${t.name} [${t.statusCode}]`);
    });
  }
  
  console.log();
  console.log('='.repeat(70));
  console.log('🧪 测试完成');
  console.log('='.repeat(70));
  
  return results;
}

// 运行测试
runTests().then(results => {
  const exitCode = (results.failed + results.timeout) > 0 ? 1 : 0;
  process.exit(exitCode);
}).catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});
