// 检查openapi.yaml中缺失的API端点
const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, 'backend/openapi.yaml');
const openapiContent = fs.readFileSync(openapiPath, 'utf8');

// 提取所有已定义的operationId
const operationIds = [];
const operationIdRegex = /operationId:\s*(\w+)/g;
let match;
while ((match = operationIdRegex.exec(openapiContent)) !== null) {
  operationIds.push(match[1]);
}

console.log('📋 OpenAPI中已定义的operationId:');
operationIds.forEach(id => console.log(`  - ${id}`));

// 列出所有API处理器文件名（不含扩展名）
const allHandlerFiles = [
  // admin 目录
  'adminLogin', 'adminLogout', 'getAdminProfile',
  'listAdminOrders', 'updateOrderStatus',
  'getOverviewStats',
  'addTenantVehicle', 'getTenantById', 'listAllTenants', 'updateTenantBasicInfo', 'updateTenantContactInfo', 'updateTenantFinancialInfo',
  'approveTenant', 'listApprovedTenants', 'listPendingTenants', 'listRejectedTenants', 'rejectTenant',
  'createAdminUser',
  'getVehicleById', 'listAllVehicles', 'searchVehicles',
  
  // carrier 目录
  'claimCarrierOrder', 'completeCarrierOrder', 'listCarrierOrders', 'startDelivery', 'submitCarrierQuote',
  
  // customer 目录
  'awardOrderToCarrier', 'bindOrderToCustomer', 'createCustomerOrder', 'deleteCustomerOrder', 'getCustomerOrder', 'getOrderQuotes', 'listCustomerOrders', 'updateCustomerOrder',
  
  // public 目录
  'createPublicOrder', 'fetchPublicOrder',
  
  // setup 目录
  'createFirstAdmin', 'getSetupStatus',
  
  // tenant 目录
  'applyPcTenant', 'getTenantProfile', 'getTenantRoles', 'loginTenantWeb', 'registerTenantWeb',
  
  // tenant-web 目录
  'claimOrder', 'listPendingOrders', 'listCarrierQuotes',
  
  // 根目录
  'healthCheck'
];

console.log('\n🔧 所有API处理器文件名:');
allHandlerFiles.forEach(file => console.log(`  - ${file}`));

console.log('\n⚠️  缺失的operationId:');
const missingOperationIds = [];
for (const handlerFile of allHandlerFiles) {
  if (!operationIds.includes(handlerFile)) {
    missingOperationIds.push(handlerFile);
    console.log(`  - ${handlerFile}`);
  }
}

console.log(`\n💡 共发现 ${missingOperationIds.length} 个缺失的operationId`);
console.log('需要在OpenAPI规范中添加这些API端点定义');