const fs = require('fs');
const path = require('path');

// 读取原始的openapi.yaml文件
const filePath = path.join(__dirname, 'backend', 'openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

console.log('原始文件大小:', content.length);

// 查找所有operationId: getAdminProfile的位置
const operationRegex = /^(\s*)operationId: getAdminProfile$/gm;
let match;
const matches = [];

while ((match = operationRegex.exec(content)) !== null) {
  matches.push({
    index: match.index,
    line: match[0],
    indent: match[1]
  });
}

console.log(`找到 ${matches.length} 个 'operationId: getAdminProfile' 实例`);

// 如果超过1个实例，则需要修复重复问题
if (matches.length > 1) {
  console.log('检测到重复的 operationId 定义，开始修复...');
  
  // 只保留第一个实例，将其余的替换为唯一的operationId
  for (let i = 1; i < matches.length; i++) {
    const match = matches[i];
    // 生成新的唯一operationId
    const newOperationId = `getAdminProfile${i}`;
    
    // 替换operationId
    const lineStart = match.index;
    const lineEnd = content.indexOf('\n', lineStart);
    const originalLine = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
    
    const newLine = originalLine.replace('getAdminProfile', newOperationId);
    content = content.substring(0, lineStart) + newLine + content.substring(lineEnd === -1 ? content.length : lineEnd);
    
    console.log(`  修复第 ${i+1} 个实例: ${originalLine.trim()} -> ${newLine.trim()}`);
  }
  
  // 将修复后的内容写回文件
  fs.writeFileSync(filePath, content);
  console.log('✅ 重复的 operationId 修复完成');
} else {
  console.log('未检测到重复的 operationId');
}

console.log('修复完成');