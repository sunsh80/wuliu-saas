const fs = require('fs');

// 读取文件的一部分来检查格式
const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf-8');

// 找到getAdminProfile附近的内容
const lines = content.split('\n');
for (let i = 0; i < lines.length && i < 5000; i++) {
  if (lines[i].includes('getAdminProfile')) {
    console.log(`Line ${i + 1}: ${JSON.stringify(lines[i])}`);
    // 显示前后几行
    if (i > 0) console.log(`Line ${i}: ${JSON.stringify(lines[i-1])}`);
    if (i < lines.length - 1) console.log(`Line ${i + 2}: ${JSON.stringify(lines[i+1])}`);
    console.log('---');
  }
}