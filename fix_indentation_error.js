// 修复openapi.yaml文件中的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 检查并修复openapi.yaml文件中的缩进错误...');

// 检查文件内容，查找错误插入的API端点定义
const lines = content.split('\n');
let correctedLines = [];
let inWrongPlace = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 检查是否是错误插入的API端点定义（缩进不正确）
  if (line.trim().startsWith('/api/') && line.startsWith('  ')) {
    // 检查是否是错误插入的 /api/tenant-web/quotes 端点
    if (line.trim() === '/api/tenant-web/quotes:' || line.trim().startsWith('/api/tenant-web/quotes')) {
      console.log(`⚠️ 发现错误缩进的API端点定义在第${i+1}行，已移除: ${line}`);
      // 跳过这一行，不加入correctedLines
      continue;
    }
  }
  
  correctedLines.push(line);
}

// 重新组合内容
const correctedContent = correctedLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('✅ openapi.yaml 文件中的缩进错误已修复');