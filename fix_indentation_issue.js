// 修复openapi.yaml文件中的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 检查并修复openapi.yaml文件中的缩进错误...');

// 按行处理文件
const lines = content.split('\n');
const correctedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNumber = i + 1;
  
  // 检查是否是错误缩进的securitySchemes行
  if (line.trim() === 'securitySchemes:' && line.startsWith('  ')) {
    // 修复缩进，移除多余的空格
    correctedLines.push('securitySchemes:');
    console.log(`⚠️ 修复第${lineNumber}行的缩进错误: ${line}`);
  } else {
    correctedLines.push(line);
  }
}

// 重新组合内容
const correctedContent = correctedLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件中的缩进错误已修复');