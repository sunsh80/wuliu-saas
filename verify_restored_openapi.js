const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  console.log('✅ OpenAPI规范解析成功');
  
  // 检查关键操作是否存在
  const hasAdminLogin = !!(spec.paths['/api/admin/login'] && spec.paths['/api/admin/login'].post && spec.paths['/api/admin/login'].post.operationId === 'adminLogin');
  const hasGetAdminProfile = !!(spec.paths['/api/admin/profile'] && spec.paths['/api/admin/profile'].get && spec.paths['/api/admin/profile'].get.operationId === 'getAdminProfile');
  
  console.log('✅ adminLogin操作存在:', hasAdminLogin);
  console.log('✅ getAdminProfile操作存在:', hasGetAdminProfile);
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}