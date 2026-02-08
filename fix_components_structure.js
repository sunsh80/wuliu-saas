// 修复openapi.yaml文件中的components结构
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 修复openapi.yaml文件中的components结构...');

// 按行分割内容
const lines = content.split(/\r?\n/);
let newLines = [];
let foundSecuritySchemes = false;
let insideComponents = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 检查是否是securitySchemes行
  if (line.trim() === 'securitySchemes:' && !line.startsWith('  ')) {
    // 在securitySchemes之前插入components
    if (!insideComponents) {
      newLines.push('components:');
      insideComponents = true;
    }
    // 添加2个空格缩进到securitySchemes
    newLines.push('  securitySchemes:');
    foundSecuritySchemes = true;
    console.log('✅ 修复securitySchemes缩进并添加components');
  } else if (line.trim() === 'schemas:' && !line.startsWith('  ')) {
    // 确保schemas也在components下
    if (!insideComponents) {
      newLines.push('components:');
      insideComponents = true;
    }
    newLines.push('  schemas:');
    console.log('✅ 修复schemas缩进');
  } else if ((line.startsWith('    ') || line.startsWith('      ') || line.startsWith('        ')) && 
             (lines[i-1] && lines[i-1].trim() === 'securitySchemes:') || 
             (lines[i-1] && lines[i-1].trim() === 'schemas:')) {
    // 如果当前行是securitySchemes或schemas的子项，但没有正确缩进
    if (!insideComponents) {
      newLines.push('components:');
      insideComponents = true;
    }
    newLines.push(line);
  } else {
    // 检查是否是components部分的子项
    if (line.startsWith('  securitySchemes:') || line.startsWith('  schemas:')) {
      insideComponents = true;
    } else if (line.trim() !== '' && !line.startsWith(' ') && insideComponents) {
      // 如果遇到非缩进行且之前在components内部，则离开components部分
      insideComponents = false;
    }
    newLines.push(line);
  }
}

// 重新组合内容
const correctedContent = newLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件结构已修复');