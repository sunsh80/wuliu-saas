const fs = require('fs');
const yaml = require('js-yaml');
try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  
  // 检查DAY 3新增的API端点
  const hasAddOrderAddons = !!(spec.paths['/api/order/{id}/add-ons'] && spec.paths['/api/order/{id}/add-ons'].post && spec.paths['/api/order/{id}/add-ons'].post.operationId === 'addOrderAddons');
  const hasConfirmOrderAddons = !!(spec.paths['/api/order/{id}/add-ons/confirm'] && spec.paths['/api/order/{id}/add-ons/confirm'].patch && spec.paths['/api/order/{id}/add-ons/confirm'].patch.operationId === 'confirmOrderAddons');
  
  console.log('✅ addOrderAddons操作存在:', hasAddOrderAddons);
  console.log('✅ confirmOrderAddons操作存在:', hasConfirmOrderAddons);
  
  if (hasAddOrderAddons) {
    console.log('  - 路径: /api/order/{id}/add-ons');
    console.log('  - 方法: POST');
    console.log('  - OperationId: addOrderAddons');
  }
  
  if (hasConfirmOrderAddons) {
    console.log('  - 路径: /api/order/{id}/add-ons/confirm');
    console.log('  - 方法: PATCH');
    console.log('  - OperationId: confirmOrderAddons');
  }
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}