// 验证YAML文件格式
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

try {
  const yamlContent = fs.readFileSync(path.join(__dirname, 'backend/openapi.yaml'), 'utf8');
  console.log('🔍 尝试解析YAML文件...');
  
  const parsed = yaml.load(yamlContent);
  console.log('✅ YAML文件格式正确，解析成功');
  
  // 检查关键部分
  console.log('\\n📋 检查关键部分:');
  console.log('  - OpenAPI版本:', parsed.openapi);
  console.log('  - 信息标题:', parsed.info?.title);
  console.log('  - 标签数量:', parsed.tags?.length);
  console.log('  - 组件数量:', Object.keys(parsed.components || {}).length);
  console.log('  - 路径数量:', Object.keys(parsed.paths || {}).length);
  
} catch (error) {
  console.error('❌ YAML文件格式错误:', error.message);
  console.error('错误位置:', error.mark);
}