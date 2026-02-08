// 检查openapi.yaml文件的特定行
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('🔍 检查openapi.yaml文件第45-55行的内容：\n');

for (let i = 44; i <= 54 && i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  console.log(`${lineNum.toString().padStart(3)}: ${line}`);
}

console.log('\n🔍 检查缩进问题：\n');

// 检查每行的前导空格
for (let i = 44; i <= 54 && i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  const leadingSpaces = line.length - line.trimStart().length;
  console.log(`${lineNum.toString().padStart(3)}: 前导空格数=${leadingSpaces}, 内容="${line}"`);
}