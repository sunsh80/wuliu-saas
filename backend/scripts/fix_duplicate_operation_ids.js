// backend/scripts/fix_duplicate_operation_ids.js
const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
let content = fs.readFileSync(openapiPath, 'utf8');

// 定义替换规则：[路径关键词，原 operationId, 新 operationId]
const replacements = [
  ['/api/tenant-web/orders/{order_id}', 'createCustomerOrder', 'tenantCreateOrder'],
  ['/api/tenant-web/orders/{order_id}/complete', 'completeCarrierOrder', 'tenantCompleteOrder'],
  ['/api/tenant-web/logout', 'claimOrder', 'logoutTenant'],
  ['/api/matching/search-carriers', 'searchVehicles', 'searchMatchingCarriers'],
  ['/api/matching/get-quote-suggestions', 'getOrderQuotes', 'getQuoteSuggestions'],
  ['/api/settlement/orders', 'getOrderQuote', 'getSettlementOrders'],
  ['/api/settlement/process', 'processSettlement', 'confirmSettlement'],
  ['/api/settlement/summary', 'getOverviewStats', 'getSettlementSummary'],
];

let count = 0;
replacements.forEach(([pathKeyword, oldId, newId]) => {
  const regex = new RegExp(`(${pathKeyword}[^\\n]*operationId:\\s*)${oldId}`, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `$1${newId}`);
    count++;
    console.log(`✅ ${oldId} -> ${newId} (${pathKeyword})`);
  }
});

fs.writeFileSync(openapiPath, content, 'utf8');
console.log(`\n修改完成，共更新 ${count} 个 operationId`);
