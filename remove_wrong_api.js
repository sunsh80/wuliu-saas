// 修复openapi.yaml文件的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 查找错误的API端点定义并移除它
const lines = content.split('\n');
const correctedLines = [];

let skipApiBlock = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 检查是否是错误插入的API端点开始
  if (line.trim().startsWith('/api/tenant-web/quotes:') || 
      line.trim().startsWith('/api/tenant-web/quotes') ||
      line.trim().startsWith('/api/tenant/quotes:')) {
    skipApiBlock = true;
    continue; // 跳过这一行
  }
  
  // 如果正在跳过API块，检查是否到达块的末尾
  if (skipApiBlock) {
    // 检查是否是新部分的开始（顶级缩进且不是空行）
    if (line.trim() !== '' && line.match(/^\w/) && !line.startsWith(' ')) {
      skipApiBlock = false;
    }
    continue; // 跳过API块中的所有行
  }
  
  correctedLines.push(line);
}

// 重新组合内容
const correctedContent = correctedLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件中的错误API端点已移除，缩进错误已修复');