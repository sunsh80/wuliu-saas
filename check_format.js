const fs = require('fs');
const readline = require('readline');

async function checkYamlFormatIssues() {
  const filePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  
  const readStream = fs.createReadStream(filePath, 'utf-8');
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let previousLine = '';
  let issues = [];
  
  for await (const line of rl) {
    lineNumber++;
    
    // 检查可能的格式问题
    if (line.includes('operationId:') && previousLine.includes('operationId:')) {
      issues.push({
        line: lineNumber,
        content: line.trim(),
        previousLine: previousLine.trim(),
        issue: '连续两行都是operationId，可能格式错误'
      });
    }
    
    // 检查是否有奇怪的拼接格式
    if (line.includes('_duplicate_') && line.includes('operationId:') && line.length > 100) {
      // 检查是否有多余的字符
      const matches = line.match(/operationId:\s+\w+_duplicate_\d+/g);
      if (matches && matches.length > 1) {
        issues.push({
          line: lineNumber,
          content: line.trim(),
          issue: '一行中包含多个operationId'
        });
      }
    }
    
    previousLine = line;
  }
  
  if (issues.length > 0) {
    console.log('发现潜在的格式问题：');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. 第 ${issue.line} 行: ${issue.issue}`);
      console.log(`   内容: "${issue.content}"`);
      if (issue.previousLine) {
        console.log(`   上一行: "${issue.previousLine}"`);
      }
      console.log('');
    });
  } else {
    console.log('未发现明显的YAML格式问题');
  }
  
  console.log(`总共扫描了 ${lineNumber} 行`);
}

checkYamlFormatIssues().catch(console.error);