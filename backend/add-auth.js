/**
 * 为 handler 添加 requireAuth 装饰器（使用 UTF-8 编码）
 */
const fs = require('fs');
const path = require('path');

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

targetHandlers.forEach(relativePath => {
  const filePath = path.join(handlersDir, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  文件不存在:', relativePath);
    return;
  }
  
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加 import（在第一个 require 之后）
  const importLine = "\nconst { requireAuth } = require('../../../../utils/requireAuth');";
  const firstRequireEnd = content.indexOf('require(');
  if (firstRequireEnd !== -1) {
    const lineEnd = content.indexOf(';', firstRequireEnd) + 1;
    content = content.slice(0, lineEnd) + importLine + content.slice(lineEnd);
  }
  
  // 替换 module.exports
  content = content.replace(
    'module.exports = async (c) => {',
    'module.exports = requireAuth(async (c) => {'
  );
  
  // 写入文件（UTF-8）
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅', relativePath);
});

console.log('\n完成！');
