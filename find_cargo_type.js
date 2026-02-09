const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  
  // 查找cargo_type的定义
  console.log('🔍 查找cargo_type定义...');
  
  // 搜索components.schemas中的定义
  if (spec.components && spec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
      if (schema.properties && schema.properties.cargo_type) {
        console.log(`\\n在 ${schemaName} 模式中找到 cargo_type 定义:`);
        console.log(`- 类型: ${schema.properties.cargo_type.type}`);
        if (schema.properties.cargo_type.enum) {
          console.log(`- 枚举值:`, schema.properties.cargo_type.enum);
        }
        if (schema.properties.cargo_type.example) {
          console.log(`- 示例: ${schema.properties.cargo_type.example}`);
        }
      }
    }
  }
  
  // 搜索路径中的定义
  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation.requestBody && operation.requestBody.content) {
          for (const [contentType, content] of Object.entries(operation.requestBody.content)) {
            if (content.schema && content.schema.properties && content.schema.properties.cargo_type) {
              console.log(`\\n在路径 ${path} ${method.toUpperCase()} 中找到 cargo_type 定义:`);
              console.log(`- 类型: ${content.schema.properties.cargo_type.type}`);
              if (content.schema.properties.cargo_type.enum) {
                console.log(`- 枚举值:`, content.schema.properties.cargo_type.enum);
              }
              if (content.schema.properties.cargo_type.example) {
                console.log(`- 示例: ${content.schema.properties.cargo_type.example}`);
              }
            }
          }
        }
      }
    }
  }
  
  console.log('\\n✅ cargo_type定义查找完成');
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}