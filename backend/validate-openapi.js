// validate-openapi.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function validateOpenAPI() {
  const specPath = path.resolve(__dirname, 'openapi.yaml');
  if (!fs.existsSync(specPath)) {
    console.error('❌ openapi.yaml 不存在');
    process.exit(1);
  }

  let spec;
  try {
    const fileContent = fs.readFileSync(specPath, 'utf8');
    spec = yaml.load(fileContent);
  } catch (err) {
    console.error('❌ openapi.yaml 解析失败:', err.message);
    process.exit(1);
  }

  if (!spec || !spec.paths) {
    console.error('❌ openapi.yaml 缺少 paths 定义');
    process.exit(1);
  }

  let errorCount = 0;
  for (const [route, methods] of Object.entries(spec.paths)) {
    if (typeof methods !== 'object') continue;

    for (const [method, op] of Object.entries(methods)) {
      // 只检查 HTTP 方法
      if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
        if (!op || typeof op !== 'object') {
          console.error(`❌ ${method.toUpperCase()} ${route} 定义无效`);
          errorCount++;
          continue;
        }

        if (!op.operationId) {
          console.error(`❌ 缺少 operationId: ${method.toUpperCase()} ${route}`);
          errorCount++;
        }
      }
    }
  }

  if (errorCount > 0) {
    console.error(`\n共发现 ${errorCount} 处缺失 operationId，请修复后再启动。`);
    process.exit(1);
  }

  console.log('✅ 所有 API 已定义 operationId，契约有效');
}

validateOpenAPI();