const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  console.log('✅ OpenAPI规范解析成功');

  // 检查新增的承运商定价API操作是否存在
  const hasCreateCarrierPricingConfig = !!(spec.paths['/api/carrier/pricing-configs'] && spec.paths['/api/carrier/pricing-configs'].post && spec.paths['/api/carrier/pricing-configs'].post.operationId === 'createCarrierPricingConfig');
  const hasListCarrierPricingConfigs = !!(spec.paths['/api/carrier/pricing-configs'] && spec.paths['/api/carrier/pricing-configs'].get && spec.paths['/api/carrier/pricing-configs'].get.operationId === 'listCarrierPricingConfigs');
  const hasGetCarrierPricingConfig = !!(spec.paths['/api/carrier/pricing-configs/{id}'] && spec.paths['/api/carrier/pricing-configs/{id}'].get && spec.paths['/api/carrier/pricing-configs/{id}'].get.operationId === 'getCarrierPricingConfig');
  const hasUpdateCarrierPricingConfig = !!(spec.paths['/api/carrier/pricing-configs/{id}'] && spec.paths['/api/carrier/pricing-configs/{id}'].put && spec.paths['/api/carrier/pricing-configs/{id}'].put.operationId === 'updateCarrierPricingConfig');
  const hasDeleteCarrierPricingConfig = !!(spec.paths['/api/carrier/pricing-configs/{id}'] && spec.paths['/api/carrier/pricing-configs/{id}'].delete && spec.paths['/api/carrier/pricing-configs/{id}'].delete.operationId === 'deleteCarrierPricingConfig');

  console.log('✅ createCarrierPricingConfig操作存在:', hasCreateCarrierPricingConfig);
  console.log('✅ listCarrierPricingConfigs操作存在:', hasListCarrierPricingConfigs);
  console.log('✅ getCarrierPricingConfig操作存在:', hasGetCarrierPricingConfig);
  console.log('✅ updateCarrierPricingConfig操作存在:', hasUpdateCarrierPricingConfig);
  console.log('✅ deleteCarrierPricingConfig操作存在:', hasDeleteCarrierPricingConfig);

  // 检查关键的原有操作是否仍然存在
  const hasAdminLogin = !!(spec.paths['/api/admin/login'] && spec.paths['/api/admin/login'].post && spec.paths['/api/admin/login'].post.operationId === 'adminLogin');
  const hasGetAdminProfile = !!(spec.paths['/api/admin/profile'] && spec.paths['/api/admin/profile'].get && spec.paths['/api/admin/profile'].get.operationId === 'getAdminProfile');

  console.log('✅ adminLogin操作存在:', hasAdminLogin);
  console.log('✅ getAdminProfile操作存在:', hasGetAdminProfile);
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}