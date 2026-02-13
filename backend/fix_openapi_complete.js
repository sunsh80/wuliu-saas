const fs = require('fs');

// 读取原文件
const content = fs.readFileSync('openapi.yaml', 'utf8');
const lines = content.split('\n');

// 找到所有 components 部分
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

// 找到每个 components 部分的边界
const componentsSections = [];
for (let i = 0; i < componentsPositions.length; i++) {
  const startPos = componentsPositions[i];
  const endPos = i < componentsPositions.length - 1 ? componentsPositions[i + 1] : lines.length;
  
  // 找到这个 components 部分的实际结束位置（下一个同级键之前）
  let actualEndPos = endPos;
  const baseIndent = lines[startPos].search(/\S/);
  
  for (let j = startPos + 1; j < endPos; j++) {
    const line = lines[j];
    const lineIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    const trimmed = line.trim();
    
    // 如果找到与 components 同级的键（但不是 schemas、securitySchemes 等子键），则 components 部分结束
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

// 提取所有 schemas 部分的内容
const allSchemas = [];
for (let i = 0; i < componentsSections.length; i++) {
  const section = componentsSections[i];
  let schemasStart = -1;
  let schemasEnd = -1;
  
  for (let j = 0; j < section.content.length; j++) {
    if (section.content[j].trim() === 'schemas:') {
      schemasStart = j;
      const baseIndent = section.content[j].search(/\S/);
      const schemasIndent = baseIndent + 2; // schemas 下的内容通常缩进2个空格
      
      // 找到 schemas 部分的结束
      for (let k = j + 1; k < section.content.length; k++) {
        const line = section.content[k];
        const lineIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
        const trimmed = line.trim();
        
        // 如果找到缩进小于等于 schemas 的非空行，或者找到下一个 components 部分，则 schemas 结束
        if ((trimmed && lineIndent <= baseIndent && trimmed.match(/^[a-z].*:/) && 
             trimmed !== 'securitySchemes:' && trimmed !== 'responses:' && 
             trimmed !== 'parameters:' && trimmed !== 'requestBodies:' && 
             trimmed !== 'headers:' && trimmed !== 'examples:' && 
             trimmed !== 'callbacks:' && trimmed !== 'links:' && 
             trimmed !== 'tags:' && trimmed !== 'externalDocs:') || 
             trimmed === 'components:') {
          schemasEnd = k;
          break;
        }
      }
      
      if (schemasEnd === -1) {
        schemasEnd = section.content.length;
      }
      break;
    }
  }
  
  if (schemasStart !== -1) {
    const schemasContent = section.content.slice(schemasStart, schemasEnd);
    allSchemas.push({
      sectionIndex: i,
      start: schemasStart,
      end: schemasEnd,
      content: schemasContent
    });
  }
}

console.log(`找到 ${allSchemas.length} 个 schemas 部分`);

// 合并所有 schemas 内容，去重
const uniqueSchemas = {};
const mergedSchemas = ['  schemas:']; // 保持正确的缩进

for (const schemaSection of allSchemas) {
  let inSchemaDefinition = false;
  let currentSchemaName = '';
  
  for (let i = 0; i < schemaSection.content.length; i++) {
    const line = schemaSection.content[i];
    const trimmed = line.trim();
    
    if (trimmed === 'schemas:') {
      continue; // 跳过 'schemas:' 行
    }
    
    // 检查是否是 schema 定义的开始（缩进为2个空格的行，且不是子属性）
    const indent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    if (indent === 2 && trimmed && trimmed.match(/^[A-Za-z].*:/) && !trimmed.endsWith(':') || 
        (indent === 2 && trimmed && trimmed.match(/^[A-Za-z].*:$/) && 
         !trimmed.match(/^(type|properties|required|minLength|maxLength|minimum|maximum|enum|format|pattern|items|additionalProperties|oneOf|anyOf|allOf|nullable|description|example|deprecated|readOnly|writeOnly|default|discriminator|xml|externalDocs|example|examples|content|style|explode|allowReserved|allowEmptyValue|deprecated):$/))) {
      // 这是一个 schema 名称定义
      const schemaName = trimmed.replace(/:.*$/, ''); // 提取名称部分
      if (!uniqueSchemas[schemaName]) {
        uniqueSchemas[schemaName] = true;
        inSchemaDefinition = true;
        currentSchemaName = schemaName;
        mergedSchemas.push(line);
      } else {
        console.log(`跳过重复的 schema 定义: ${schemaName}`);
        inSchemaDefinition = false; // 跳过这个重复的 schema
      }
    } else if (inSchemaDefinition) {
      // 这是当前 schema 的内容
      mergedSchemas.push(line);
    }
  }
}

console.log(`合并后有 ${Object.keys(uniqueSchemas).length} 个唯一的 schemas`);

// 构建新的文件内容：只保留第一个 components 部分（不含 schemas），加上合并后的 schemas，再加上其他内容
const firstComponentsSection = componentsSections[0];
const newContent = [];

// 添加第一个 components 之前的内容
newContent.push(...lines.slice(0, firstComponentsSection.start));
newContent.push(lines[firstComponentsSection.start]); // 添加 'components:'

// 添加第一个 components 中除 schemas 外的内容
let inFirstSchemas = false;
for (let i = 1; i < firstComponentsSection.content.length; i++) {
  const line = firstComponentsSection.content[i];
  const trimmed = line.trim();
  
  if (trimmed === 'schemas:') {
    inFirstSchemas = true;
    continue; // 跳过原来的 'schemas:' 行，因为我们将在后面添加合并的 schemas
  }
  
  if (inFirstSchemas) {
    // 跳过原来的 schemas 内容
    const lineIndent = line.search(/\S/) === -1 ? 999 : line.search(/\S/);
    const baseIndent = firstComponentsSection.content[0].search(/\S/); // components 的缩进
    const schemasIndent = baseIndent + 2; // schemas 的缩进
    
    if (trimmed && lineIndent <= baseIndent && trimmed.match(/^[a-z].*:/) && 
        trimmed !== 'securitySchemes:' && trimmed !== 'responses:' && 
        trimmed !== 'parameters:' && trimmed !== 'requestBodies:' && 
        trimmed !== 'headers:' && trimmed !== 'examples:' && 
        trimmed !== 'callbacks:' && trimmed !== 'links:' && 
        trimmed !== 'tags:' && trimmed !== 'externalDocs:') {
      // 这是下一个同级部分的开始，schemas 部分结束了
      inFirstSchemas = false;
      newContent.push(line); // 添加这个新部分
    }
    // 如果仍在 schemas 内部，不添加任何内容（跳过）
  } else {
    // 添加非 schemas 部分的内容
    newContent.push(line);
  }
}

// 添加合并后的 schemas
newContent.push(...mergedSchemas);

// 添加第一个 components 部分之后的所有内容（即其他 components 部分之后的内容）
newContent.push(...lines.slice(componentsSections[componentsSections.length - 1].end));

console.log('正在写入修复后的文件...');

// 写入修复后的文件
fs.writeFileSync('openapi.yaml.fixed', newContent.join('\n'));

console.log('✅ openapi.yaml 文件已修复，保存为 openapi.yaml.fixed');
console.log('修复内容：合并了所有重复的 components 部分和 schemas 定义');

// 现在将修复后的内容写回原文件
fs.writeFileSync('openapi.yaml', newContent.join('\n'));

console.log('✅ 已将修复后的内容写回原 openapi.yaml 文件');