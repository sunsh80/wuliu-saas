const fs = require('fs');
const readline = require('readline');

async function cleanAndFixGetAdminProfile() {
  const inputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_clean_fixed.yaml';
  
  const readStream = fs.createReadStream(inputPath, 'utf-8');
  const writeStream = fs.createWriteStream(outputPath, 'utf-8');
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let getAdminProfileCount = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否是 getAdminProfile operationId 行（包括已被错误标记的）
    if (/\s*operationId:\s*getAdminProfile(_duplicate_\d+(_duplicate_\d+)?)?\s*$/.test(line)) {
      getAdminProfileCount++;
      
      if (getAdminProfileCount === 1) {
        // 保留第一个原始的 getAdminProfile
        writeStream.write(line + '\n');
        console.log(`第 ${lineCount} 行: 保留原始的 getAdminProfile`);
      } else {
        // 将后续所有的都改为唯一的名称
        const leadingSpaces = line.match(/^\s*/)[0]; // 获取前导空格
        const modifiedLine = `${leadingSpaces}operationId: getAdminProfile_duplicate_${getAdminProfileCount}`;
        writeStream.write(modifiedLine + '\n');
        console.log(`第 ${lineCount} 行: 修复为 -> ${modifiedLine.trim()}`);
      }
    } else {
      // 其他行保持不变
      writeStream.write(line + '\n');
    }
  }
  
  writeStream.end();
  
  console.log(`\n清理和修复完成！`);
  console.log(`- 总共处理了 ${getAdminProfileCount} 个与 getAdminProfile 相关的操作ID`);
  if (getAdminProfileCount > 1) {
    console.log(`- 保留 1 个原始的 getAdminProfile 操作ID`);
    console.log(`- 修复 ${getAdminProfileCount - 1} 个重复的操作ID`);
  }
}

cleanAndFixGetAdminProfile().catch(console.error);