const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  console.log('✅ OpenAPI规范解析成功');
  console.log('✅ 版本:', spec.openapi);
  console.log('✅ 标题:', spec.info.title);
  
  // 检查getAdminProfile操作
  if (spec.paths['/api/admin/profile'] && spec.paths['/api/admin/profile'].get) {
    const operation = spec.paths['/api/admin/profile'].get;
    console.log('✅ getAdminProfile操作存在:', operation.operationId);
  } else {
    console.log('❌ getAdminProfile操作不存在');
  }
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}