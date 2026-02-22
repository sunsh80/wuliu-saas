/**
 * 修复 requireAuth 路径
 * admin/* 下的文件：../../../../utils/requireAuth (4 层)
 * tenant/* 和 carrier/* 下的文件：../../../utils/requireAuth (3 层)
 */
const fs = require('fs');

// admin - 4 层
const adminFiles = [
  'backend/api/handlers/admin/commissions/getCommissionConfig.js',
  'backend/api/handlers/admin/commissions/listCommissionRecords.js',
  'backend/api/handlers/admin/commissions/updateCommissionConfig.js',
  'backend/api/handlers/admin/commissions/updateCommissionRecordStatus.js',
  'backend/api/handlers/admin/settings/listServiceProviders.js',
  'backend/api/handlers/admin/settings/listSettings.js',
  'backend/api/handlers/admin/settings/listSystemSettings.js',
  'backend/api/handlers/admin/settings/setConfigValue.js',
  'backend/api/handlers/admin/settings/updateServiceProvider.js',
  'backend/api/handlers/admin/settings/updateSetting.js',
  'backend/api/handlers/admin/settings/updateSystemSetting.js',
  'backend/api/handlers/admin/vehicle-tracking/getLatestPositions.js',
  'backend/api/handlers/admin/vehicle-tracking/getVehiclePositions.js',
  'backend/api/handlers/admin/violations/createViolation.js',
  'backend/api/handlers/admin/violations/deleteViolation.js',
  'backend/api/handlers/admin/violations/getViolationById.js',
  'backend/api/handlers/admin/violations/getViolationStats.js',
  'backend/api/handlers/admin/violations/listViolations.js',
  'backend/api/handlers/admin/violations/updateViolation.js'
];

// carrier 和 tenant - 3 层
const otherFiles = [
  'backend/api/handlers/carrier/order/claimCarrierOrder.js',
  'backend/api/handlers/tenant/tenantBatchUploadStopPoints.js',
  'backend/api/handlers/tenant/tenantDeleteMyStopPoint.js',
  'backend/api/handlers/tenant/tenantGetMyStopPoint.js',
  'backend/api/handlers/tenant/tenantListMyStopPoints.js',
  'backend/api/handlers/tenant/tenantUpdateMyStopPoint.js',
  'backend/api/handlers/tenant/tenantUploadStopPoint.js'
];

adminFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /require\(['"]\.\.\/(?:\.\.\/)+utils\/requireAuth['"]\)/g,
    "require('../../../../utils/requireAuth')"
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ (4 层)', file);
});

otherFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /require\(['"]\.\.\/(?:\.\.\/)+utils\/requireAuth['"]\)/g,
    "require('../../../utils/requireAuth')"
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ (3 层)', file);
});

console.log('\n完成！');
