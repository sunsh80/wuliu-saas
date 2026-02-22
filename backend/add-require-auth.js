/**
 * 为 28 个 handler 添加统一的 requireAuth 装饰器
 */
const fs = require('fs');
const path = require('path');

// 需要添加认证的 handler 列表
const targetHandlers = [
  'admin/commissions/getCommissionConfig.js',
  'admin/commissions/listCommissionRecords.js',
  'admin/commissions/updateCommissionConfig.js',
  'admin/commissions/updateCommissionRecordStatus.js',
  'admin/settings/listServiceProviders.js',
  'admin/settings/listSettings.js',
  'admin/settings/listSystemSettings.js',
  'admin/settings/setConfigValue.js',
  'admin/settings/updateServiceProvider.js',
  'admin/settings/updateSetting.js',
  'admin/settings/updateSystemSetting.js',
  'admin/vehicle-tracking/getLatestPositions.js',
  'admin/vehicle-tracking/getVehiclePositions.js',
  'admin/violations/createViolation.js',
  'admin/violations/deleteViolation.js',
  'admin/violations/getViolationById.js',
  'admin/violations/getViolationStats.js',
  'admin/violations/listViolations.js',
  'admin/violations/updateViolation.js',
  'carrier/order/claimCarrierOrder.js',
  'tenant/tenantBatchUploadStopPoints.js',
  'tenant/tenantDeleteMyStopPoint.js',
  'tenant/tenantGetMyStopPoint.js',
  'tenant/tenantListMyStopPoints.js',
  'tenant/tenantUpdateMyStopPoint.js',
  'tenant/tenantUploadStopPoint.js'
];

const handlersDir = path.join(__dirname, 'api', 'handlers');
let modifiedCount = 0;

targetHandlers.forEach(relativePath => {
  const filePath = path.join(handlersDir, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log('⚠️  文件不存在:', relativePath);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 检查是否已有 requireAuth
  if (content.includes('requireAuth')) {
    console.log('⏭️  已有 requireAuth:', relativePath);
    return;
  }

  // 添加 requireAuth 导入 - 在第一个 require 之后
  const importLine = "const { requireAuth } = require('../../../utils/requireAuth');\n";
  const firstRequireMatch = content.match(/^(const\s+\{?\s*\w+\s*\}?\s*=\s*require\([^)]+\);)/m);
  
  if (firstRequireMatch) {
    // 在第一个 require 之后插入
    const insertIndex = firstRequireMatch.index + firstRequireMatch[0].length;
    content = content.slice(0, insertIndex) + '\n' + importLine + content.slice(insertIndex);
  } else {
    // 没有 require，在文件开头添加
    content = importLine + '\n' + content;
  }

  // 包裹 module.exports - 使用更精确的正则
  content = content.replace(
    /^module\.exports\s*=\s*async\s*\(\s*c\s*\)\s*=>\s*\{/m,
    'module.exports = requireAuth(async (c) => {'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 已添加认证:', relativePath);
  modifiedCount++;
});

console.log(`\n完成：修改了 ${modifiedCount} 个文件`);
