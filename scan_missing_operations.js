// 检查并添加缺失的API端点定义
const fs = require('fs');
const path = require('path');

// 读取openapi.yaml文件
const openapiPath = path.join(__dirname, 'backend/openapi.yaml');
const openapiContent = fs.readFileSync(openapiPath, 'utf8');

// 提取所有已定义的operationId
const operationIds = [];
const operationIdRegex = /operationId:\s*(\w+)/g;
let match;
while ((match = operationIdRegex.exec(openapiContent)) !== null) {
  operationIds.push(match[1]);
}

console.log('📋 已在OpenAPI规范中定义的operationId:');
operationIds.forEach(id => console.log(`  - ${id}`));

// 扫描所有API处理器文件，提取operationId
const handlersDir = path.join(__dirname, 'backend/api/handlers');
const foundOperationIds = [];

function scanHandlers(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanHandlers(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 从文件内容中提取operationId
      // 通常在注释或代码中会提及operationId
      const basename = path.basename(file, '.js');
      
      // 检查文件中是否有明确的operationId定义
      const operationIdMatches = content.match(/operationId:\s*['"]?(\w+)['"]?/g);
      if (operationIdMatches) {
        operationIdMatches.forEach(opMatch => {
          const opId = opMatch.split(':')[1].trim().replace(/['"]/g, '');
          if (!foundOperationIds.includes(opId)) {
            foundOperationIds.push(opId);
          }
        });
      } else {
        // 如果没有明确的operationId定义，使用文件名作为operationId
        if (!foundOperationIds.includes(basename)) {
          foundOperationIds.push(basename);
        }
      }
    }
  }
}

scanHandlers(handlersDir);

console.log('\n🔍 所有API处理器文件对应的operationId:');
foundOperationIds.forEach(id => console.log(`  - ${id}`));

// 检查哪些operationId缺失
console.log('\n⚠️  缺失的operationId:');
const missingOperationIds = [];
for (const handlerOpId of foundOperationIds) {
  if (!operationIds.includes(handlerOpId)) {
    missingOperationIds.push(handlerOpId);
    console.log(`  - ${handlerOpId}`);
  }
}

console.log(`\n💡 共发现 ${missingOperationIds.length} 个缺失的operationId`);

// 输出缺失的API端点定义模板
if (missingOperationIds.length > 0) {
  console.log('\n📋 缺失的API端点定义模板:');
  missingOperationIds.forEach(opId => {
    console.log(`\n  # Missing API endpoint for: ${opId}`);
  });
}