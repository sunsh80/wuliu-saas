const fs = require('fs');
const readline = require('readline');

async function extractUniqueOperations() {
  const filePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  const operationLines = [];
  let getAdminProfileContext = [];
  let collectingGetAdminProfile = false;
  let getAdminProfileStartLine = -1;
  let braceLevel = 0;
  let insideGetAdminProfile = false;

  for await (const line of rl) {
    lineNum++;
    
    // 检测到 getAdminProfile 的 operationId
    if (line.includes('operationId: getAdminProfile')) {
      console.log(`在第 ${lineNum} 行找到 getAdminProfile:`, line.trim());
      
      if (!insideGetAdminProfile) {
        // 开始收集第一个 getAdminProfile 的上下文
        insideGetAdminProfile = true;
        collectingGetAdminProfile = true;
        getAdminProfileStartLine = lineNum;
        braceLevel = 0;
        getAdminProfileContext = [];
      } else {
        // 这是重复的，跳过
        console.log(`  -> 这是重复的定义，将在修复时移除`);
      }
    }
    
    if (collectingGetAdminProfile) {
      getAdminProfileContext.push(`${lineNum}:${line}`);
      
      // 计算缩进级别来确定何时结束
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('get:') || trimmedLine.startsWith('post:') || 
          trimmedLine.startsWith('put:') || trimmedLine.startsWith('delete:')) {
        braceLevel++; // 操作对象开始
      } else if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        // 空行或注释不影响层级
      } else if (line.match(/^\s*[\w-]+:/) && !line.includes('operationId:')) {
        // 检查当前缩进级别
        const currentIndent = line.search(/\S/);
        if (currentIndent <= 2 && trimmedLine !== 'responses:' && !trimmedLine.includes('security:')) {
          // 可能是同级元素，意味着当前操作已结束
          const prevLineTrimmed = getAdminProfileContext.length > 1 ? 
            getAdminProfileContext[getAdminProfileContext.length-2] : '';
          if (prevLineTrimmed && !prevLineTrimmed.includes('parameters:') && !prevLineTrimmed.includes('requestBody:')) {
            // 结束收集
            console.log(`  -> getAdminProfile 操作定义在第 ${lineNum} 行结束`);
            collectingGetAdminProfile = false;
            
            // 输出第一个定义的上下文
            console.log('\\n=== 第一个 getAdminProfile 定义的上下文 ===');
            getAdminProfileContext.forEach(ctx => {
              console.log(ctx);
            });
            console.log('=== 结束 ===\\n');
          }
        }
      }
    }
  }
  
  console.log('\\n分析完成。检测到多个 getAdminProfile 定义，需要修复OpenAPI规范。');
}

extractUniqueOperations().catch(console.error);