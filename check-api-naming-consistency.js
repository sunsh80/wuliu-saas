/**
 * API参数命名一致性检查脚本
 * 检查OpenAPI规范、后端处理程序和数据库模式之间参数命名的一致性
 */

const fs = require('fs');
const path = require('path');

// 检查API参数命名一致性
function checkApiNamingConsistency() {
  console.log('🔍 开始检查API参数命名一致性...\n');
  
  // 1. 检查OpenAPI规范中的路径参数命名
  const openApiSpec = fs.readFileSync('./backend/openapi.yaml', 'utf8');

  // 仅匹配路径定义中的参数，排除正则表达式中的模式
  const lines = openApiSpec.split('\n');
  const pathParamMatches = [];

  for (const line of lines) {
    // 只在路径定义行查找参数（以/开头的路径）
    if (line.trim().startsWith('/') && line.includes('{') && line.includes('}')) {
      // 提取路径参数
      const matches = line.match(/\{([a-zA-Z0-9_]+)\}/g);
      if (matches) {
        pathParamMatches.push(...matches);
      }
    }
  }

  console.log('📋 OpenAPI规范中的路径参数:');
  const openApiParams = [];
  if (pathParamMatches) {
    pathParamMatches.forEach(param => {
      const paramName = param.substring(1, param.length - 1); // 移除花括号
      if (!openApiParams.includes(paramName)) {
        openApiParams.push(paramName);
        console.log(`  - ${paramName} (应使用snake_case)`);

        // 检查是否符合snake_case规范
        if (!/^[a-z][a-z0-9_]*$/.test(paramName)) {
          console.log(`    ⚠️  警告: ${paramName} 不符合snake_case命名规范`);
        }
      }
    });
  }
  
  // 2. 检查后端处理程序中的参数提取
  const handlerDir = './backend/api/handlers';
  const handlers = findHandlerFiles(handlerDir);

  console.log('\n🔧 检查后端处理程序中的参数提取...');
  handlers.forEach(handler => {
    const content = fs.readFileSync(handler, 'utf8');

    // 查找参数提取的多种模式
    const patterns = [
      /c\.request\.params\.([a-zA-Z0-9_]+)/g,  // c.request.params.paramName
      /c\.req\.param\(\s*['"]([^'"]+)['"]\s*\)/g,  // c.req.param('paramName')
      /const\s+\{([^}]+)\}\s+=\s+c\.req\.param/g,  // const { paramName } = c.req.param
      /const\s+\{([^}]+)\}\s+=\s+c\.request\.params/g  // const { paramName } = c.request.params
    ];

    let foundParams = false;

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        if (!foundParams) {
          console.log(`\n  文件: ${path.relative('.', handler)}`);
          foundParams = true;
        }

        matches.forEach(match => {
          let paramName;

          if (pattern.toString().includes('c.req.param')) {
            // 处理 c.req.param('paramName') 模式
            const extracted = match.match(/['"]([^'"]+)['"]/);
            if (extracted) paramName = extracted[1];
          } else if (pattern.toString().includes('{')) {
            // 处理解构赋值模式
            const extracted = match.match(/\{([^}]+)\}/);
            if (extracted) {
              paramName = extracted[1].trim().split(':')[0].trim(); // 获取第一个参数名
            }
          } else {
            // 处理 c.request.params.paramName 模式
            paramName = match.split('.')[2];
          }

          if (paramName) {
            console.log(`    提取参数: ${paramName}`);

            // 检查是否与OpenAPI规范中的参数名匹配（考虑命名转换）
            const snakeCaseParam = toSnakeCase(paramName);
            if (openApiParams.includes(snakeCaseParam)) {
              console.log(`      ✅ 匹配OpenAPI参数: ${snakeCaseParam}`);
            } else {
              console.log(`      ⚠️  未在OpenAPI规范中找到对应参数: ${snakeCaseParam}`);
            }
          }
        });
      }
    }
  });
  
  // 3. 检查数据库字段命名
  const dbSchema = fs.readFileSync('./backend/db/schema.js', 'utf8');
  const dbFieldMatches = dbSchema.match(/['"]([a-z][a-z0-9_]*)['"]:|column\.name === ['"]([a-z][a-z0-9_]*)['"]/gi);
  
  console.log('\n💾 检查数据库字段命名...');
  if (dbFieldMatches) {
    dbFieldMatches.forEach(field => {
      const fieldName = field.replace(/['"]/g, '').trim();
      if (fieldName && /^[a-z][a-z0-9_]*$/.test(fieldName)) {
        console.log(`  - ${fieldName} (符合snake_case规范)`);
      }
    });
  }
  
  console.log('\n✅ API参数命名一致性检查完成!');
}

// 辅助函数：将camelCase转换为snake_case
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// 辅助函数：查找处理程序文件
function findHandlerFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findHandlerFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// 运行检查
checkApiNamingConsistency();