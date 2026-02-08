// 检查openapi.yaml中缺失的API端点定义
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

// 检查handlers目录中所有API处理器文件
const handlersDir = path.join(__dirname, 'backend/api/handlers/admin');
const allFiles = [];

// 递归获取所有JS文件
function getFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath);
    } else if (file.endsWith('.js')) {
      allFiles.push(filePath);
    }
  }
}

getFiles(handlersDir);

console.log('\n🔍 检测到的API处理器文件:');
const handlerOperationIds = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // 从文件路径推断operationId
  const relativePath = path.relative(handlersDir, file);
  const pathParts = relativePath.replace('.js', '').split(path.sep);
  
  // 根据文件路径构造operationId
  let operationId = pathParts[pathParts.length - 1];
  
  // 特殊处理一些文件名
  if (operationId === 'getOverviewStats') {
    operationId = 'getOverviewStats';
  } else if (operationId === 'listAllVehicles') {
    operationId = 'listAllVehicles';
  } else if (operationId === 'searchVehicles') {
    operationId = 'searchVehicles';
  } else if (operationId === 'getVehicleById') {
    operationId = 'getVehicleById';
  }
  
  handlerOperationIds.push(operationId);
  console.log(`  - ${file} -> ${operationId}`);
}

// 检查哪些operationId缺失
console.log('\n⚠️  缺失的operationId:');
const missingOperationIds = [];
for (const handlerOpId of handlerOperationIds) {
  if (!operationIds.includes(handlerOpId)) {
    missingOperationIds.push(handlerOpId);
    console.log(`  - ${handlerOpId}`);
  }
}

if (missingOperationIds.length === 0) {
  console.log('  ✅ 没有缺失的operationId');
} else {
  console.log(`\n💡 需要在OpenAPI规范中添加以上 ${missingOperationIds.length} 个API端点定义`);
}