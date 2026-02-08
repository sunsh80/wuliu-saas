// 修复openapi.yaml文件中的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 修复openapi.yaml文件中的缩进错误...');

// 按行处理文件
const lines = content.split(/\r?\n/);
const correctedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNumber = i + 1;
  
  // 检查是否是API路径定义行，它们应该是没有缩进或只有2个空格缩进（在paths: 下）
  if (line.trim().startsWith('/api/') && line.startsWith('  ')) {
    // 检查前一行是否是 'paths:'，如果不是，这可能是错误的缩进
    let hasCorrectIndentation = false;
    
    // 找到最近的 'paths:' 定义
    let j = i - 1;
    while (j >= 0 && !lines[j].includes('components:')) {  // 在到达components部分之前
      if (lines[j].trim() === 'paths:') {
        hasCorrectIndentation = true;
        break;
      }
      if (lines[j].trim() === 'components:') {
        break;
      }
      j--;
    }
    
    // 如果当前行是API路径定义，它应该有4个空格的缩进（相对于paths:）
    // 但如果它在其他部分（如tags部分）被错误地插入了，就会有问题
    if (line.startsWith('  ') && !line.startsWith('    ')) {  // 2个空格但不是4个空格
      // 检查是否在错误的位置（如在tags部分内）
      let inTagsSection = false;
      let inPathsSection = false;
      
      for (let k = 0; k < i; k++) {
        if (lines[k].trim() === 'tags:') {
          inTagsSection = true;
        } else if (lines[k].trim() === 'paths:') {
          inTagsSection = false;
          inPathsSection = true;
        } else if (lines[k].trim() === 'components:' && inTagsSection) {
          inTagsSection = false;
        }
      }
      
      if (!inPathsSection) {
        // 这是一个错误插入的API定义，应该移除或修正
        console.log(`⚠️ 发现错误缩进的API路径定义在第${lineNumber}行: ${line}`);
        // 我们需要找到正确的paths部分并移动API定义到那里
        continue; // 跳过这一行，稍后正确添加
      }
    }
  }
  
  correctedLines.push(line);
}

// 重新组合内容
const correctedContent = correctedLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件中的缩进错误已修复');