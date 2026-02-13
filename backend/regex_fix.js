const fs = require('fs');

// 读取 openapi.yaml 文件
const content = fs.readFileSync('openapi.yaml', 'utf8');

// 使用正则表达式找到所有 schemas 部分
const schemasRegex = /(schemas:\s*\n)((?:\s+.+\n?)*)/g;
let result = content.replace(schemasRegex, (match, header, body) => {
  // 分割 body 为行
  const lines = body.split('\n');
  
  // 跟踪已见过的 schema 名称
  const seenSchemas = new Set();
  const newLines = [];
  let currentSchemaName = null;
  let skipCurrentSchema = false;
  
  for (const line of lines) {
    // 检查是否是 schema 定义（缩进为2个空格的行，如 "  SchemaName:"）
    const schemaMatch = line.match(/^(\s{2})([A-Z][A-Za-z0-9_]+):(.*)/);
    if (schemaMatch) {
      const [, indent, schemaName, rest] = schemaMatch;
      
      if (seenSchemas.has(schemaName)) {
        // 这是重复的 schema，开始跳过
        console.log(`Skipping duplicate schema: ${schemaName}`);
        skipCurrentSchema = true;
        currentSchemaName = schemaName;
        continue; // 不添加这一行
      } else {
        // 这是一个新 schema
        seenSchemas.add(schemaName);
        skipCurrentSchema = false;
        currentSchemaName = schemaName;
        newLines.push(line);
        continue;
      }
    }
    
    // 如果当前在跳过一个重复的 schema
    if (skipCurrentSchema) {
      // 检查是否是同级缩进的行（意味着新 schema 的开始）
      const levelMatch = line.match(/^(\s{2})[^-\s]/); // 匹配缩进为2个空格的非列表行
      if (levelMatch && line.trim() && !line.trim().startsWith('#')) {
        // 这是新 schema 的开始，停止跳过当前重复的 schema
        skipCurrentSchema = false;
        
        // 检查这个新 schema 是否也是重复的
        const newSchemaMatch = line.match(/^\s{2}([A-Z][A-Za-z0-9_]+):/);
        if (newSchemaMatch) {
          const newSchemaName = newSchemaMatch[1];
          if (seenSchemas.has(newSchemaName)) {
            // 这个新 schema 也是重复的
            console.log(`Skipping duplicate schema: ${newSchemaName}`);
            skipCurrentSchema = true;
            currentSchemaName = newSchemaName;
            continue; // 不添加这一行
          } else {
            // 这是一个新 schema
            seenSchemas.add(newSchemaName);
            currentSchemaName = newSchemaName;
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else {
        // 这是当前重复 schema 的内容，继续跳过
        continue;
      }
    } else {
      // 不在跳过模式下，添加行
      newLines.push(line);
    }
  }
  
  return header + newLines.join('\n');
});

// 写入修复后的文件
fs.writeFileSync('openapi.yaml', result);
console.log('✅ openapi.yaml file has been fixed, duplicate schema definitions removed');