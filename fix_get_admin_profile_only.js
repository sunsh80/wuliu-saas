const fs = require('fs');
const readline = require('readline');

async function fixGetAdminProfileOnly() {
  const inputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_fixed_minimal.yaml';
  
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(outputPath);
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let getAdminProfileCount = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否是 getAdminProfile operationId 行
    if (line.includes('operationId: getAdminProfile')) {
      getAdminProfileCount++;
      
      // 保留第一次出现的，修改后续出现的
      if (getAdminProfileCount > 1) {
        // 修改重复的 operationId
        const modifiedLine = line.replace('getAdminProfile', `getAdminProfile_duplicate_${getAdminProfileCount}`);
        writeStream.write(modifiedLine + '\n');
        console.log(`第 ${lineCount} 行: 修复重复的 getAdminProfile -> getAdminProfile_duplicate_${getAdminProfileCount}`);
      } else {
        // 保留第一次出现的
        writeStream.write(line + '\n');
      }
    } else {
      // 其他行保持不变
      writeStream.write(line + '\n');
    }
  }
  
  writeStream.end();
  
  console.log(`\n修复完成！`);
  console.log(`- 总共找到 ${getAdminProfileCount} 个 getAdminProfile 操作ID`);
  if (getAdminProfileCount > 1) {
    console.log(`- 已修复 ${getAdminProfileCount - 1} 个重复的操作ID`);
    console.log(`- 保留 1 个原始的 getAdminProfile 操作ID`);
  } else {
    console.log(`- 没有发现重复的 getAdminProfile 操作ID`);
  }
  
  console.log(`\n现在可以替换原文件:`);
  console.log(`  1. 备份原文件: copy backend\\openapi.yaml backend\\openapi.yaml.backup2`);
  console.log(`  2. 替换原文件: copy backend\\openapi_fixed_minimal.yaml backend\\openapi.yaml`);
}

fixGetAdminProfileOnly().catch(console.error);