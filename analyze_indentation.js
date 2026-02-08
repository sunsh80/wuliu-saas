// 精确检查openapi.yaml文件中的缩进错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('🔍 检查openapi.yaml文件中第47-49行的内容：\n');

for (let i = 46; i <= 48 && i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  const leadingSpaces = line.length - line.trimStart().length;
  console.log(`${lineNum.toString().padStart(3)}: [前导空格=${leadingSpaces}] ${line}`);
}

// 检查第48行是否有缩进问题
if (47 < lines.length) {
  const line48 = lines[47]; // 第48行（索引47）
  const trimmedLine48 = line48.trim();
  
  console.log('\n🔍 详细分析第48行:');
  console.log(`  原始内容: "${line48}"`);
  console.log(`  去除空格后: "${trimmedLine48}"`);
  console.log(`  前导空格数: ${line48.length - line48.trimStart().length}`);
  
  // 检查是否是securitySchemes，以及它的缩进是否正确
  if (trimmedLine48 === 'securitySchemes:') {
    console.log('  ✓ 第48行是securitySchemes:，这是正常的顶级元素');
  } else {
    console.log('  ⚠️ 第48行内容不是预期的securitySchemes:');
  }
}

// 检查上下文，看看是否有错误插入的内容
console.log('\n🔍 检查上下文环境...');
let inTagsSection = false;
let inPathsSection = false;
let inComponentsSection = false;

for (let i = 40; i <= 60 && i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  const trimmedLine = line.trim();
  
  if (trimmedLine === 'tags:') {
    inTagsSection = true;
    inPathsSection = false;
    inComponentsSection = false;
  } else if (trimmedLine === 'paths:') {
    inTagsSection = false;
    inPathsSection = true;
    inComponentsSection = false;
  } else if (trimmedLine === 'components:') {
    inTagsSection = false;
    inPathsSection = false;
    inComponentsSection = true;
  }
  
  if (trimmedLine.startsWith('/api/')) {
    if (!inPathsSection) {
      console.log(`  ⚠️ 第${lineNum}行: API路径 "${trimmedLine}" 不在paths部分内`);
    } else {
      console.log(`  ✓ 第${lineNum}行: API路径 "${trimmedLine}" 在paths部分内`);
    }
  }
}