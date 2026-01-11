// scripts/generate-handler-map.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function getHandlerDir(operationId) {
  // 根据 operationId 前缀自动推断目录（可按需调整）
  if (operationId.startsWith('admin')) return 'admin';
  if (operationId.startsWith('customer')) return 'customer';
  if (operationId.startsWith('carrier')) return 'carrier';
  if (operationId.startsWith('setup')) return 'setup';
  if (operationId.startsWith('tenant')) return 'tenant';
  if (operationId.startsWith('createPublic') || operationId.startsWith('listPublic')) return 'public';
  return 'misc'; // 兜底
}

function main() {
  const openapiPath = path.join(__dirname, '../openapi.yaml');
  const spec = yaml.load(fs.readFileSync(openapiPath, 'utf8'));

  let tableRows = [];
  for (const [route, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const operationId = op.operationId;
      if (!operationId) continue;
      const dir = getHandlerDir(operationId);
      const filePath = `api/handlers/${dir}/${operationId}.js`;
      tableRows.push(`| \`${route}\` | \`${method.toUpperCase()}\` | \`${operationId}\` | \`${filePath}\` |`);
    }
  }

  const markdown = `# 📜 Handler 文件命名与路径映射表

> 自动生成于 ${new Date().toISOString().split('T')[0]}  
> 源文件: \`openapi.yaml\`  
> **此表为命名唯一权威依据，请严格遵守！**

| API 路径 | 方法 | operationId | 推荐 Handler 路径 |
|---------|------|-------------|------------------|
${tableRows.join('\n')}
`;

  fs.writeFileSync(path.join(__dirname, '../HANDLER_MAPPING.md'), markdown);
  console.log('✅ 已生成 HANDLER_MAPPING.md');
}

main();