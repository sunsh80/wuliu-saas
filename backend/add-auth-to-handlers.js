/**
 * 为 handler 添加认证检查
 * 如果 c.context 或 c.context.id 不存在，返回 401
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');

// 需要添加认证检查的 handler 列表（根据文档中的 28 个 handler）
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
  'carrier/order/confirmOrderAddons.js',
  'tenant/tenantBatchUploadStopPoints.js',
  'tenant/tenantDeleteMyStopPoint.js',
  'tenant/tenantGetMyStopPoint.js',
  'tenant/tenantListMyStopPoints.js',
  'tenant/tenantUpdateMyStopPoint.js',
  'tenant/tenantUploadStopPoint.js'
];

const authCheckCode = `  // 认证检查
  if (!c.context || !c.context.id) {
    return {
      statusCode: 401,
      body: {
        success: false,
        error: 'UNAUTHORIZED',
        message: '未授权访问，请先登录'
      }
    };
  }

`;

let modifiedCount = 0;

targetHandlers.forEach(relativePath => {
  const file = path.join(handlersDir, relativePath);
  
  if (!fs.existsSync(file)) {
    console.log('⚠️  文件不存在:', relativePath);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // 检查是否已有认证检查
  if (content.includes('if (!c.context || !c.context.id)')) {
    console.log('⏭️  已有认证检查:', relativePath);
    return;
  }
  
  // 在 module.exports = async (c) => { 之后添加认证检查
  const exportPattern = /module\.exports\s*=\s*async\s*\([^)]+\)\s*=>\s*\{/;
  if (exportPattern.test(content)) {
    content = content.replace(
      exportPattern,
      'module.exports = async (c) => {\n' + authCheckCode
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ 已添加认证检查:', relativePath);
    modifiedCount++;
  } else {
    console.log('❌ 无法匹配导出模式:', relativePath);
  }
});

console.log(`\n完成：修改了 ${modifiedCount} 个文件`);
