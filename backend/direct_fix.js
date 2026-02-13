const fs = require('fs');

// 读取 openapi.yaml 文件
const content = fs.readFileSync('openapi.yaml', 'utf8');
const lines = content.split('\n');

// 跟踪已见过的 schema 名称
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
    // 检查是否是 schema 定义（缩进为2个空格的行，如 "  SchemaName:"）
    const indent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    if (indent === 2 && trimmed && trimmed.match(/^[A-Z][A-Za-z0-9_]*:/)) {
      // 提取 schema 名称（去掉冒号）
      const schemaName = trimmed.replace(/:.*$/, '');
      
      if (seenSchemas.has(schemaName)) {
        // 这是重复的 schema，开始跳过直到遇到下一个同级缩进的行
        console.log(`Skipping duplicate schema definition: ${schemaName} at line ${i+1}`);
        skippingCurrentSchema = true;
      } else {
        // 这是一个新 schema，添加到集合中
        seenSchemas.add(schemaName);
        skippingCurrentSchema = false;
        newLines.push(line);
      }
    } else if (!skippingCurrentSchema) {
      // 如果不是 schema 定义行，且当前 schema 不是重复的，则添加行
      newLines.push(line);
    } else {
      // 检查是否到达了当前重复 schema 的结束（遇到下一个同级缩进的行）
      const currentIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
      if (currentIndent === 2 && trimmed && trimmed.match(/^[A-Z][A-Za-z0-9_]*:/)) {
        // 这是下一个 schema 的开始，当前重复 schema 结束
        skippingCurrentSchema = false;
        // 添加这个新的 schema（需要检查是否重复）
        const nextSchemaName = trimmed.replace(/:.*$/, '');
        if (seenSchemas.has(nextSchemaName)) {
          // 这个新 schema 也是重复的
          console.log(`Skipping duplicate schema definition: ${nextSchemaName} at line ${i+1}`);
          skippingCurrentSchema = true;
          newLines.push(line); // 但仍然添加这一行，然后继续跳过其内容
        } else {
          // 这是一个新 schema
          seenSchemas.add(nextSchemaName);
          newLines.push(line);
        }
      }
      // 如果是更深缩进的行，继续跳过（这是重复 schema 的内容）
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