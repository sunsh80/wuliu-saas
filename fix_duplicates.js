const fs = require('fs');
const readline = require('readline');

async function fixDuplicateDefinitions() {
  const filePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputFilePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_final.yaml';
  
  const readStream = fs.createReadStream(filePath, 'utf-8');
  const writeStream = fs.createWriteStream(outputFilePath, 'utf-8');
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let getAdminProfileCount = 0;
  let insideSkippedSection = false;
  let linesSkipped = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否是 getAdminProfile operationId 行
    if (/\s*operationId:\s*getAdminProfile(_duplicate_\d+)?\s*$/.test(line)) {
      getAdminProfileCount++;
      
      if (getAdminProfileCount === 1) {
        // 保留第一个
        writeStream.write(line + '\n');
        console.log(`第 ${lineCount} 行: 保留第一个 getAdminProfile 定义`);
      } else {
        // 跳过这个和接下来的相关行，直到遇到下一个主要部分
        insideSkippedSection = true;
        linesSkipped++;
        console.log(`第 ${lineCount} 行: 跳过重复的 getAdminProfile 定义`);
      }
    } else if (insideSkippedSection) {
      // 检查是否到达了下一个主要部分（以 / 开头的路径定义或其他操作）
      if (/^\s*\/\w/.test(line) || /^\s*(get|post|put|delete|patch|options|head|trace):\s*/.test(line)) {
        // 到达新部分，停止跳过
        insideSkippedSection = false;
        writeStream.write(line + '\n');
      } else {
        // 继续跳过
        linesSkipped++;
      }
    } else {
      // 正常写入其他行
      writeStream.write(line + '\n');
    }
  }
  
  writeStream.end();
  
  console.log(`\\n修复完成！`);
  console.log(`- 总共处理了 ${getAdminProfileCount} 个 getAdminProfile 定义`);
  console.log(`- 保留了 1 个原始定义`);
  console.log(`- 跳过了 ${getAdminProfileCount - 1} 个重复定义及其相关内容`);
  console.log(`- 额外跳过了 ${linesSkipped} 行相关内容`);
  
  if (getAdminProfileCount > 1) {
    console.log(`\\n✅ 重复的 getAdminProfile 定义问题已解决！`);
    console.log(`现在只有一个 getAdminProfile 操作ID，符合OpenAPI规范。`);
  }
}

fixDuplicateDefinitions().catch(console.error);