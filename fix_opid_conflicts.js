const fs = require('fs');
const readline = require('readline');

async function fixOnlyOperationIdConflicts() {
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
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否是 getAdminProfile operationId 行
    if (/^\s*operationId:\s*getAdminProfile\s*$/.test(line.trim())) {
      getAdminProfileCount++;
      
      if (getAdminProfileCount === 1) {
        // 保留第一个原始的
        writeStream.write(line + '\n');
        console.log(`第 ${lineCount} 行: 保留原始的 getAdminProfile`);
      } else {
        // 为后续的分配唯一ID，但保留其所属的API端点结构
        // 我们需要知道这个操作属于哪个路径和HTTP方法
        
        // 这里我们简单地为其分配一个唯一ID，但实际应用中可能需要更智能的处理
        // 比如基于路径或功能来命名
        const leadingSpaces = line.match(/^(\s*)/)[1];
        const newOperationId = `getAdminProfile_v${getAdminProfileCount}`;
        const newLine = `${leadingSpaces}operationId: ${newOperationId}`;
        writeStream.write(newLine + '\n');
        console.log(`第 ${lineCount} 行: 重命名为 ${newOperationId}`);
      }
    } else {
      // 其他行保持不变
      writeStream.write(line + '\n');
    }
  }
  
  writeStream.end();
  
  console.log(`\\n修复完成！`);
  console.log(`- 总共找到 ${getAdminProfileCount} 个 getAdminProfile 操作`);
  if (getAdminProfileCount > 1) {
    console.log(`- 保留 1 个原始的 getAdminProfile 操作ID`);
    console.log(`- 重命名 ${getAdminProfileCount - 1} 个重复的操作ID为唯一值`);
    console.log(`\\n现在每个操作都有唯一的operationId，符合OpenAPI规范。`);
  }
}

fixOnlyOperationIdConflicts().catch(console.error);