const fs = require('fs');

// 读取原文件
const content = fs.readFileSync('openapi.yaml', 'utf8');
const lines = content.split('\n');

// 找到所有 components 部分的起始位置
const componentsPositions = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'components:') {
    componentsPositions.push(i);
  }
}

if (componentsPositions.length <= 1) {
  console.log('没有发现重复的 components 部分，无需修复');
  process.exit(0);
}

console.log(`发现 ${componentsPositions.length} 个 components 部分，位置:`, componentsPositions.map(p => p + 1));

// 提取所有 components 部分的内容
const componentsSections = [];
for (let i = 0; i < componentsPositions.length; i++) {
  const startPos = componentsPositions[i];
  const endPos = i < componentsPositions.length - 1 ? componentsPositions[i + 1] : lines.length;
  
  // 找到实际的结束位置（下一个同级键之前）
  let actualEndPos = endPos;
  const baseIndent = lines[startPos].search(/\S/);
  
  for (let j = startPos + 1; j < endPos; j++) {
    const line = lines[j];
    const lineIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    const trimmed = line.trim();
    
    // 如果找到与 components 同级的键，则当前 components 部分结束
    if (trimmed && lineIndent <= baseIndent && trimmed.match(/^[a-z].*:/) && 
        trimmed !== 'securitySchemes:' && trimmed !== 'schemas:' && 
        trimmed !== 'responses:' && trimmed !== 'parameters:' && 
        trimmed !== 'requestBodies:' && trimmed !== 'headers:' && 
        trimmed !== 'examples:' && trimmed !== 'callbacks:' && 
        trimmed !== 'links:' && trimmed !== 'tags:' && trimmed !== 'externalDocs:') {
      actualEndPos = j;
      break;
    }
  }
  
  componentsSections.push({
    start: startPos,
    end: actualEndPos,
    content: lines.slice(startPos, actualEndPos)
  });
}

console.log(`提取了 ${componentsSections.length} 个 components 部分`);

// 提取所有 schemas 部分的内容并去重
const allSchemas = {};
const newContent = [];

// 处理第一个 components 部分（保留 securitySchemes 等，但不保留 schemas）
const firstComponents = componentsSections[0];
for (let i = 0; i < firstComponents.content.length; i++) {
  const line = firstComponents.content[i];
  const trimmed = line.trim();
  
  if (trimmed === 'schemas:') {
    // 跳过 'schemas:' 行，稍后添加合并后的 schemas
    continue;
  }
  
  // 检查是否是 schema 定义（缩进为2个空格的行，如 "  SchemaName:")
  const indent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
  if (indent === 2 && trimmed && trimmed.match(/^[A-Z][A-Za-z].*:/) && !trimmed.startsWith('type:') && !trimmed.startsWith('properties:')) {
    // 这是一个 schema 名称定义，提取名称
    const schemaName = trimmed.replace(/:.*$/, '');
    allSchemas[schemaName] = true;
    console.log(`在第一个 components 中发现 schema: ${schemaName}`);
  }
  
  // 如果不是 schemas 部分的内容，则添加到新内容中
  if (trimmed !== 'schemas:') {
    newContent.push(line);
    
    // 如果是 securitySchemes、responses 等部分，继续添加这些内容
    if (trimmed === 'securitySchemes:' || trimmed === 'responses:' || trimmed === 'parameters:' || 
        trimmed === 'requestBodies:' || trimmed === 'headers:' || trimmed === 'examples:' || 
        trimmed === 'callbacks:' || trimmed === 'links:' || trimmed === 'tags:' || trimmed === 'externalDocs:') {
      // 继续添加这些部分的内容，直到遇到下一个同级键
      const sectionIndent = line.search(/\S/);
      for (let j = i + 1; j < firstComponents.content.length; j++) {
        const nextLine = firstComponents.content[j];
        const nextLineIndent = nextLine.search(/\S/) === -1 ? 999 : nextLine.search(/\S/);
        const nextTrimmed = nextLine.trim();
        
        if (nextTrimmed && nextLineIndent <= sectionIndent && nextTrimmed.match(/^[a-z].*:/) && 
            nextTrimmed !== 'securitySchemes:' && nextTrimmed !== 'schemas:' && 
            nextTrimmed !== 'responses:' && nextTrimmed !== 'parameters:' && 
            nextTrimmed !== 'requestBodies:' && nextTrimmed !== 'headers:' && 
            nextTrimmed !== 'examples:' && nextTrimmed !== 'callbacks:' && 
            nextTrimmed !== 'links:' && nextTrimmed !== 'tags:' && nextTrimmed !== 'externalDocs:') {
          // 这是下一个部分的开始
          i = j - 1; // 设置 i 为当前位置，下次循环会处理 j
          break;
        }
        
        newContent.push(nextLine);
      }
    }
  }
}

// 提取所有 components 部分中的 schemas 内容并合并
console.log('正在提取所有 schemas...');
for (let i = 0; i < componentsSections.length; i++) {
  const section = componentsSections[i];
  let inSchemas = false;
  let schemasIndent = -1;
  
  for (let j = 0; j < section.content.length; j++) {
    const line = section.content[j];
    const trimmed = line.trim();
    
    if (trimmed === 'schemas:') {
      inSchemas = true;
      schemasIndent = line.search(/\S/);
      continue;
    }
    
    if (inSchemas) {
      // 检查是否是 schema 定义（缩进为 schemas 下一级的行，如 "  SchemaName:"）
      const lineIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
      if (lineIndent === schemasIndent + 2 && trimmed && trimmed.match(/^[A-Z][A-Za-z].*:/)) {
        // 这是一个 schema 名称定义，提取名称
        const schemaName = trimmed.replace(/:.*$/, '');
        if (!allSchemas[schemaName]) {
          allSchemas[schemaName] = true;
          console.log(`添加 schema: ${schemaName}`);
        } else {
          console.log(`跳过重复的 schema: ${schemaName}`);
          continue; // 跳过重复的 schema
        }
      }
      
      // 检查是否 schemas 部分结束（遇到同级或上级缩进的键）
      if (trimmed && lineIndent <= schemasIndent && trimmed.match(/^[a-z].*:/) && 
          trimmed !== 'securitySchemes:' && trimmed !== 'schemas:' && 
          trimmed !== 'responses:' && trimmed !== 'parameters:' && 
          trimmed !== 'requestBodies:' && trimmed !== 'headers:' && 
          trimmed !== 'examples:' && trimmed !== 'callbacks:' && 
          trimmed !== 'links:' && trimmed !== 'tags:' && trimmed !== 'externalDocs:') {
        inSchemas = false;
        break; // schemas 部分结束
      }
      
      if (inSchemas) {
        newContent.push(line);
      }
    }
  }
}

// 添加合并后的 schemas 部分（如果之前没有添加过）
let schemasAlreadyAdded = false;
for (const line of newContent) {
  if (line.trim() === 'schemas:') {
    schemasAlreadyAdded = true;
    break;
  }
}

if (!schemasAlreadyAdded) {
  newContent.splice(newContent.findIndex(line => line.trim() === 'components:') + 1, 0, '  schemas:');
}

// 添加 components 部分之后的内容（其他 components 部分之后的内容）
const lastComponentsEnd = componentsSections[componentsSections.length - 1].end;
for (let i = lastComponentsEnd; i < lines.length; i++) {
  newContent.push(lines[i]);
}

console.log(`合并后有 ${Object.keys(allSchemas).length} 个唯一的 schemas`);

// 写入修复后的文件
fs.writeFileSync('openapi.yaml', newContent.join('\n'));

console.log('✅ openapi.yaml 文件已修复');
console.log('修复内容：合并了所有重复的 components 部分和 schemas 定义');