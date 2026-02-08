// 检查openapi.yaml中缺失的operationId
const fs = require('fs');
const path = require('path');

// 读取openapi.yaml文件
const openapiPath = path.join(__dirname, 'backend/openapi.yaml');
const openapiContent = fs.readFileSync(openapiPath, 'utf8');

// 提取所有已定义的operationId
const operationIds = [];
const operationIdRegex = /operationId:\s*(\w+)/g;
let match;
while ((match = operationIdRegex.exec(openapiContent)) !== null) {
  operationIds.push(match[1]);
}

console.log('📋 当前openapi.yaml中定义的operationId:');
operationIds.forEach(id => console.log(`  - ${id}`));

// 手动列出所有API处理器文件名（不含扩展名）
const handlerFiles = [
  'adminLogin',
  'adminLogout', 
  'getAdminProfile',
  'listAdminOrders',
  'updateOrderStatus',
  'getOverviewStats',
  'addTenantVehicle',
  'getTenantById',
  'listAllTenants',
  'updateTenantBasicInfo',
  'updateTenantContactInfo',
  'updateTenantFinancialInfo',
  'approveTenant',
  'listApprovedTenants',
  'listPendingTenants',
  'listRejectedTenants',
  'rejectTenant',
  'createAdminUser',
  'getVehicleById',
  'listAllVehicles',
  'searchVehicles'
];

console.log('\n🔧 所有API处理器文件名:');
handlerFiles.forEach(file => console.log(`  - ${file}`));

console.log('\n⚠️  缺失的operationId:');
const missingOperationIds = [];
for (const handlerFile of handlerFiles) {
  if (!operationIds.includes(handlerFile)) {
    missingOperationIds.push(handlerFile);
    console.log(`  - ${handlerFile}`);
  }
}

if (missingOperationIds.length === 0) {
  console.log('  ✅ 没有缺失的operationId');
} else {
  console.log(`\n💡 需要添加以上 ${missingOperationIds.length} 个API端点定义`);
}