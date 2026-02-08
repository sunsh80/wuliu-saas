// 检查securitySchemes部分是否有错误插入的内容
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('🔍 检查securitySchemes部分是否有错误插入的内容...\n');

let inSecuritySchemes = false;
let securitySchemesStartLine = -1;
let securitySchemesEndLine = -1;

// 找到securitySchemes部分
for (let i = 0; i < lines.length; i++) {
  const trimmedLine = lines[i].trim();
  
  if (trimmedLine === 'securitySchemes:') {
    inSecuritySchemes = true;
    securitySchemesStartLine = i;
    console.log(`✅ 找到securitySchemes部分开始于第${i + 1}行`);
  } else if (inSecuritySchemes) {
    // 检查是否是下一个顶级元素的开始
    const line = lines[i];
    const leadingSpaces = line.length - line.trimStart().length;
    
    // 如果遇到没有缩进的行（或缩进少于4个空格的行）且不是空行或注释，则可能是securitySchemes部分的结束
    if (leadingSpaces === 0 && trimmedLine !== '' && !trimmedLine.startsWith('#')) {
      inSecuritySchemes = false;
      securitySchemesEndLine = i - 1;
      console.log(`✅ securitySchemes部分结束于第${i}行之前`);
      break;
    }
  }
}

// 如果遍历完仍未找到结束，说明securitySchemes部分一直延续到文件末尾
if (inSecuritySchemes && securitySchemesEndLine === -1) {
  securitySchemesEndLine = lines.length - 1;
  console.log(`✅ securitySchemes部分延续到文件末尾（第${lines.length}行）`);
}

// 检查securitySchemes部分的内容
if (securitySchemesStartLine !== -1 && securitySchemesEndLine !== -1) {
  console.log(`\n📋 securitySchemes部分内容（第${securitySchemesStartLine + 1}-${securitySchemesEndLine + 1}行）:`);
  
  for (let i = securitySchemesStartLine; i <= securitySchemesEndLine && i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();
    const leadingSpaces = line.length - line.trimStart().length;
    
    // 检查是否有API路径定义错误地插入到securitySchemes部分
    if (trimmedLine.startsWith('/api/')) {
      console.log(`  ⚠️ 第${lineNum}行: 发现错误插入的API路径 "${trimmedLine}" (前导空格: ${leadingSpaces})`);
    } else {
      console.log(`  ${lineNum.toString().padStart(3)}: [${leadingSpaces}sp] ${line}`);
    }
  }
}

// 检查整个文件是否有API路径错误地插入到其他部分
console.log('\n🔍 检查整个文件是否有API路径错误插入到非paths部分...');
for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // 检查是否是API路径定义，但不在正确的上下文中
  if (trimmedLine.startsWith('/api/') && trimmedLine.endsWith(':')) {
    // 检查缩进，判断它是否在正确的位置
    const leadingSpaces = line.length - line.trimStart().length;
    
    // 通常API路径应该在paths部分下，有2个空格的缩进（在paths:下面）
    // 如果有其他缩进，可能是错误插入的
    if (leadingSpaces !== 2) {
      console.log(`  ⚠️ 第${lineNum}行: API路径 "${trimmedLine}" 有不寻常的缩进 (${leadingSpaces} spaces)`);
    }
  }
}