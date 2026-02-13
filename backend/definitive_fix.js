const fs = require('fs');

// 读取 openapi.yaml 文件
const content = fs.readFileSync('openapi.yaml', 'utf8');

// 分割内容为行
const lines = content.split('\n');

// 用于跟踪已处理的 schema 名称
const seenSchemas = new Set();
const newLines = [];
let inSchemasSection = false;
let skippingCurrentSchema = false;

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
  if (inSchemasSection && trimmed &&
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
    // 检查是否是 schema 定义（缩进恰好为2个空格的行，如 "  SchemaName:"）
    const indentMatch = line.match(/^(\s{2})([A-Z][A-Za-z0-9_]*):(.*)/);
    if (indentMatch) {
      const [, spaces, schemaName, rest] = indentMatch;
      
      if (seenSchemas.has(schemaName)) {
        // 这是重复的 schema，开始跳过直到遇到下一个同级缩进的行
        console.log(`Skipping duplicate schema definition: ${schemaName} at line ${i+1}`);
        skippingCurrentSchema = true;
        continue; // 不添加这个重复的 schema 行
      } else {
        // 这是一个新 schema，添加到集合中
        seenSchemas.add(schemaName);
        skippingCurrentSchema = false;
        newLines.push(line);
        continue;
      }
    } else if (!skippingCurrentSchema) {
      // 如果不是 schema 定义行，且当前 schema 不是重复的，则添加行
      newLines.push(line);
      continue;
    } else {
      // 当前在跳过重复 schema 的内容，检查是否到达了结束
      const levelMatch = line.match(/^(\s{2})([A-Z][A-Za-z0-9_]*):/);
      if (levelMatch) {
        // 这是下一个 schema 的开始，当前重复 schema 结束
        skippingCurrentSchema = false;
        const nextSchemaName = levelMatch[2];
        if (seenSchemas.has(nextSchemaName)) {
          // 这个新 schema 也是重复的
          console.log(`Skipping duplicate schema definition: ${nextSchemaName} at line ${i+1}`);
          continue; // 不添加这个重复的 schema 行
        } else {
          // 这是一个新 schema
          seenSchemas.add(nextSchemaName);
          newLines.push(line);
        }
      }
      // 如果是更深缩进的行，继续跳过（这是重复 schema 的内容）
      continue;
    }
  } else {
    // 不在 schemas 部分，直接添加行
    newLines.push(line);
  }
}

// 写入修复后的文件
fs.writeFileSync('openapi.yaml', newLines.join('\n'));
console.log('✅ openapi.yaml file has been fixed, duplicate schema definitions removed');
console.log(`Processed ${seenSchemas.size} unique schemas`);