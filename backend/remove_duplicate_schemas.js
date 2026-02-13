const fs = require('fs');

// 读取 openapi.yaml 文件
const content = fs.readFileSync('openapi.yaml', 'utf8');
const lines = content.split('\n');

// 用于跟踪已处理的 schema 名称
const processedSchemas = new Set();
const newLines = [];
let inSchemasSection = false;
let skipCurrentSchema = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // 检查是否进入 schemas 部分
  if (trimmed === 'schemas:') {
    inSchemasSection = true;
    newLines.push(line);
    continue;
  }

  // 检查是否离开 schemas 部分
  if (inSchemasSection && line.trim() && 
      line.search(/\S/) <= 2 && // 检查缩进是否小于等于2（同级键）
      trimmed.match(/^[a-z].*:/) && // 是否是键值对
      trimmed !== 'schemas:' &&
      trimmed !== 'securitySchemes:' &&
      trimmed !== 'responses:' &&
      trimmed !== 'parameters:' &&
      trimmed !== 'requestBodies:' &&
      trimmed !== 'headers:' &&
      trimmed !== 'examples:' &&
      trimmed !== 'callbacks:' &&
      trimmed !== 'links:' &&
      trimmed !== 'tags:' &&
      trimmed !== 'externalDocs:') {
    inSchemasSection = false;
    newLines.push(line);
    continue;
  }

  if (inSchemasSection) {
    // 检查是否是 schema 定义（缩进为2个空格的行，如 "  SchemaName:"）
    const indent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    if (indent === 2 && trimmed && trimmed.match(/^[A-Z][A-Za-z0-9].*:/)) {
      // 提取 schema 名称（去掉冒号）
      const schemaName = trimmed.slice(0, -1);
      
      if (processedSchemas.has(schemaName)) {
        // 这是重复的 schema，标记为跳过
        console.log(`跳过重复的 schema 定义: ${schemaName}`);
        skipCurrentSchema = true;
      } else {
        // 这是一个新 schema，添加到集合中
        processedSchemas.add(schemaName);
        skipCurrentSchema = false;
        newLines.push(line);
      }
    } else if (!skipCurrentSchema) {
      // 如果不是 schema 定义行，且当前 schema 不是重复的，则添加行
      newLines.push(line);
    }
    // 如果 skipCurrentSchema 为 true，跳过当前行
  } else {
    // 不在 schemas 部分，直接添加行
    newLines.push(line);
  }
}

// 写入修复后的文件
fs.writeFileSync('openapi.yaml', newLines.join('\n'));
console.log('✅ openapi.yaml 文件已修复，重复的 schema 定义已移除');