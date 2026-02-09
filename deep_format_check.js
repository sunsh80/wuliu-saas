const fs = require('fs');
const readline = require('readline');

async function deepFormatCheck() {
  const filePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  
  const readStream = fs.createReadStream(filePath, 'utf-8');
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let lines = [];
  
  for await (const line of rl) {
    lineNumber++;
    lines.push({num: lineNumber, content: line});
  }
  
  // 检查特定区域的格式问题
  console.log('检查 getAdminProfile 相关行的格式...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.content.includes('getAdminProfile')) {
      console.log(`第 ${line.num} 行: ${line.content.trim()}`);
      
      // 检查前后几行的缩进一致性
      if (i > 0) {
        const prevLine = lines[i-1];
        console.log(`  上一行 (${prevLine.num}): ${prevLine.content.trim()}`);
      }
      if (i < lines.length - 1) {
        const nextLine = lines[i+1];
        console.log(`  下一行 (${nextLine.num}): ${nextLine.content.trim()}`);
      }
      console.log(''); // 空行分隔
    }
  }
  
  console.log('\\n检查完成。');
}

deepFormatCheck().catch(console.error);