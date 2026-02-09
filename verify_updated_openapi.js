const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  console.log('✅ OpenAPI规范解析成功');

  // 检查新增的价格API操作是否存在
  const hasListPricingRules = !!(spec.paths['/api/admin/pricing-rules'] && spec.paths['/api/admin/pricing-rules'].get && spec.paths['/api/admin/pricing-rules'].get.operationId === 'listPlatformPricingRules');
  const hasCreatePricingRule = !!(spec.paths['/api/admin/pricing-rules'] && spec.paths['/api/admin/pricing-rules'].post && spec.paths['/api/admin/pricing-rules'].post.operationId === 'createPlatformPricingRule');
  const hasGetPricingRule = !!(spec.paths['/api/admin/pricing-rules/{id}'] && spec.paths['/api/admin/pricing-rules/{id}'].get && spec.paths['/api/admin/pricing-rules/{id}'].get.operationId === 'getPlatformPricingRule');
  const hasUpdatePricingRule = !!(spec.paths['/api/admin/pricing-rules/{id}'] && spec.paths['/api/admin/pricing-rules/{id}'].put && spec.paths['/api/admin/pricing-rules/{id}'].put.operationId === 'updatePlatformPricingRule');
  const hasDeletePricingRule = !!(spec.paths['/api/admin/pricing-rules/{id}'] && spec.paths['/api/admin/pricing-rules/{id}'].delete && spec.paths['/api/admin/pricing-rules/{id}'].delete.operationId === 'deletePlatformPricingRule');

  console.log('✅ listPlatformPricingRules操作存在:', hasListPricingRules);
  console.log('✅ createPlatformPricingRule操作存在:', hasCreatePricingRule);
  console.log('✅ getPlatformPricingRule操作存在:', hasGetPricingRule);
  console.log('✅ updatePlatformPricingRule操作存在:', hasUpdatePricingRule);
  console.log('✅ deletePlatformPricingRule操作存在:', hasDeletePricingRule);

  // 检查关键的原有操作是否仍然存在
  const hasAdminLogin = !!(spec.paths['/api/admin/login'] && spec.paths['/api/admin/login'].post && spec.paths['/api/admin/login'].post.operationId === 'adminLogin');
  const hasGetAdminProfile = !!(spec.paths['/api/admin/profile'] && spec.paths['/api/admin/profile'].get && spec.paths['/api/admin/profile'].get.operationId === 'getAdminProfile');

  console.log('✅ adminLogin操作存在:', hasAdminLogin);
  console.log('✅ getAdminProfile操作存在:', hasGetAdminProfile);
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}