const fs = require('fs');
const readline = require('readline');

async function createValidOpenApiFile() {
  const inputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_valid.yaml';
  
  const readStream = fs.createReadStream(inputPath, 'utf-8');
  const writeStream = fs.createWriteStream(outputPath, 'utf-8');
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let inProblematicArea = false;
  let getAdminProfileCount = 0;
  let correctedLines = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否进入可能导致重复键的区域
    if (lineCount >= 1440 && lineCount <= 1450) {
      console.log(`第 ${lineCount} 行: ${line.trim()}`);
    }
    
    // 检查是否是 getAdminProfile operationId 行
    if (/\s*operationId:\s*getAdminProfile\s*$/.test(line)) {
      getAdminProfileCount++;
      
      if (getAdminProfileCount === 1) {
        // 保留第一个
        writeStream.write(line + '\n');
        correctedLines++;
      } else {
        // 跳过重复的
        console.log(`第 ${lineCount} 行: 跳过重复的 getAdminProfile`);
      }
    } else {
      // 检查是否是导致重复键的问题行
      // 在第1446行附近，我们检查路径定义
      if (lineCount === 1446) {
        // 这是问题行，我们需要确保它不会造成重复
        console.log(`第 ${lineCount} 行 (问题行): ${line.trim()}`);
      }
      
      writeStream.write(line + '\n');
    }
  }
  
  writeStream.end();
  
  console.log(`\\n文件处理完成！`);
  console.log(`- 总共处理了 ${lineCount} 行`);
  console.log(`- 发现了 ${getAdminProfileCount} 个 getAdminProfile 操作`);
  console.log(`- 保留了 1 个，去除了 ${Math.max(0, getAdminProfileCount - 1)} 个重复项`);
  console.log(`\\n注意：YAML格式错误可能仍然存在于其他地方，需要进一步修复。`);
}

createValidOpenApiFile().catch(console.error);