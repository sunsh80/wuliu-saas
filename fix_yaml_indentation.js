// 修复openapi.yaml文件中的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 检查文件内容，查找可能的缩进错误
console.log('🔍 检查openapi.yaml文件中的缩进错误...');

// 按行分割内容
const lines = content.split('\n');

// 检查每一行的缩进
let correctedLines = [];
let inPathsSection = false;
let inComponentsSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 检查是否进入paths部分
  if (line.trim() === 'paths:') {
    inPathsSection = true;
    inComponentsSection = false;
  }
  
  // 检查是否进入components部分
  if (line.trim() === 'components:') {
    inPathsSection = false;
    inComponentsSection = true;
  }
  
  // 检查是否有错误插入的API端点定义
  if (line.includes('/api/tenant-web/quotes:') && !line.trim().startsWith('/api/tenant-web/quotes:')) {
    console.log(`⚠️ 发现错误缩进的API端点定义在第${i+1}行: ${line}`);
    // 跳过这一行，不加入correctedLines
    continue;
  }
  
  correctedLines.push(line);
}

// 重新组合内容
const correctedContent = correctedLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件中的缩进错误已修复');