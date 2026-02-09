const fs = require('fs');
const readline = require('readline');

async function fixYamlStructure() {
  const inputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_fixed_structure.yaml';
  
  const readStream = fs.createReadStream(inputPath, 'utf-8');
  const writeStream = fs.createWriteStream(outputPath, 'utf-8');
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let inProblematicSection = false;
  let problemStartLine = 0;
  let correctedLines = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // 检查是否是问题区域（围绕第1446行）
    if (lineCount >= 1440 && lineCount <= 1450) {
      console.log(`第 ${lineCount} 行: ${line}`);
    }
    
    // 检查可能导致重复键的问题
    if (lineCount === 1446) {
      // 这是错误指出的问题行
      console.log(`问题行 ${lineCount}: ${line.trim()}`);
    }
    
    // 修复特定的格式问题
    // 检查是否有不正确的缩进或结构问题
    if (line.trim().startsWith('/') && !line.includes(':')) {
      // 如果路径行没有冒号，可能是格式错误
      if (line.trim().endsWith('{id}')) {
        // 这可能是路径参数定义，需要确保格式正确
        const correctedLine = line.replace(/(\s*)(\/[\w\/{}-]+)/, '$1$2:');
        if (correctedLine !== line) {
          console.log(`修复第 ${lineCount} 行: ${line.trim()} -> ${correctedLine.trim()}`);
          writeStream.write(correctedLine + '\\n');
          correctedLines++;
          continue;
        }
      }
    }
    
    // 检查是否有奇怪的组合行
    if (line.includes('summary:') && line.includes('operationId:')) {
      // 这种情况不应该在同一行出现，需要分离
      if ((line.match(/summary:/g) || []).length > 1 || (line.match(/operationId:/g) || []).length > 1) {
        console.log(`第 ${lineCount} 行有格式问题: ${line.trim()}`);
        // 分割成多行
        const parts = line.split(/(?=\\s*\\w+:\\s)/);
        for (const part of parts) {
          if (part.trim()) {
            writeStream.write(part + '\\n');
          }
        }
        correctedLines++;
        continue;
      }
    }
    
    writeStream.write(line + '\\n');
  }
  
  writeStream.end();
  
  console.log(`\\n修复完成！`);
  console.log(`- 总共处理了 ${lineCount} 行`);
  console.log(`- 修复了 ${correctedLines} 个格式问题`);
}

fixYamlStructure().catch(console.error);