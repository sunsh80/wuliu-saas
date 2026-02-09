const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 读取原始的openapi.yaml文件
const filePath = path.join(__dirname, 'backend', 'openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

console.log('原始文件大小:', content.length);

// 解析YAML内容
let openApiSpec;
try {
  openApiSpec = yaml.load(content);
  console.log('YAML解析成功');
} catch (error) {
  console.error('YAML解析失败:', error.message);
  process.exit(1);
}

// 检查paths中的所有operationId
const seenOperationIds = new Set();
const duplicates = [];
const paths = openApiSpec.paths || {};

for (const [path, pathObj] of Object.entries(paths)) {
  for (const [method, operation] of Object.entries(pathObj)) {
    if (operation.operationId) {
      if (seenOperationIds.has(operation.operationId)) {
        console.log(`发现重复的operationId: ${operation.operationId} 在 ${method.toUpperCase()} ${path}`);
        duplicates.push({ path, method, operationId: operation.operationId });
      } else {
        seenOperationIds.add(operation.operationId);
      }
    }
  }
}

console.log(`总共发现 ${duplicates.length} 个重复的operationId`);

if (duplicates.length > 0) {
  console.log('由于文件过大且复杂，建议使用专门的OpenAPI工具来修复重复项');
  console.log('当前不执行自动修复以防止损坏文件');
} else {
  console.log('未发现重复的operationId');
}