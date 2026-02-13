const fs = require('fs');

// 读取 openapi.yaml 文件
const content = fs.readFileSync('openapi.yaml', 'utf8');

// 使用正则表达式一次性处理整个文件，找出 schemas 部分并去重
const schemaSectionRegex = /(schemas:\s*\n)(\s+[^#\s].+\s*:.+\n(?:\s+.+\n)*)/g;

let result = content.replace(schemaSectionRegex, (match, header, body) => {
  console.log('Processing schemas section');
  
  // 分割 body 为行
  const lines = body.split('\n');
  const seenSchemas = new Set();
  const newLines = [];
  let skippingCurrentSchema = false;
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      // 空行或注释行，直接添加
      if (!skippingCurrentSchema) {
        newLines.push(line);
      }
      continue;
    }
    
    // 检查是否是 schema 定义（缩进为2个空格后跟字母）
    const schemaMatch = line.match(/^(\s{2})([A-Z][A-Za-z0-9_]+):(.*)/);
    if (schemaMatch) {
      const [, indent, schemaName, rest] = schemaMatch;
      
      if (seenSchemas.has(schemaName)) {
        // 这是重复的 schema，开始跳过
        console.log(`Skipping duplicate schema: ${schemaName}`);
        skippingCurrentSchema = true;
        continue; // 不添加这一行
      } else {
        // 这是一个新 schema
        seenSchemas.add(schemaName);
        skippingCurrentSchema = false;
        newLines.push(line);
        continue;
      }
    }
    
    // 检查是否是同级缩进的行（意味着新 schema 的开始）
    const levelMatch = line.match(/^(\s{2})([A-Z][A-Za-z0-9_]+):/);
    if (levelMatch && levelMatch[2]) {
      const schemaName = levelMatch[2];
      if (seenSchemas.has(schemaName)) {
        // 这个 schema 也是重复的
        console.log(`Skipping duplicate schema: ${schemaName}`);
        skippingCurrentSchema = true;
        continue; // 不添加这一行
      } else {
        // 这是一个新 schema
        seenSchemas.add(schemaName);
        skippingCurrentSchema = false;
        newLines.push(line);
        continue;
      }
    }
    
    // 如果当前在跳过模式下，检查是否是更深的缩进（属于要跳过的 schema 的内容）
    const currentIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    if (skippingCurrentSchema && currentIndent > 2) {
      // 这是重复 schema 的内容，跳过
      continue;
    } else if (skippingCurrentSchema && currentIndent === 2) {
      // 这是新的同级内容，停止跳过
      skippingCurrentSchema = false;
      newLines.push(line);
    } else if (!skippingCurrentSchema) {
      // 不在跳过模式下，添加行
      newLines.push(line);
    }
  }
  
  return header + newLines.join('\n');
});

// 写入修复后的文件
fs.writeFileSync('openapi.yaml', result);
console.log('✅ openapi.yaml file has been fixed, duplicate schema definitions removed');