// 修复openapi.yaml文件的结构
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 查找components部分的开始位置
const componentsIndex = content.indexOf('components:');

if (componentsIndex !== -1) {
  // 分离API路径部分和components部分
  const apiPart = content.substring(0, componentsIndex);
  const componentsPart = content.substring(componentsIndex);

  // 修复：移除错误插入到tags部分的API端点定义
  // 首先，我们需要找到错误插入的API端点并移除它
  let correctedApiPart = apiPart;
  
  // 查找错误插入的API端点定义
  const incorrectApiStart = correctedApiPart.indexOf('  /api/tenant-web/quotes:');
  if (incorrectApiStart !== -1) {
    // 查找这个API端点定义的结束位置（找到下一个顶级键）
    const partBeforeApi = correctedApiPart.substring(0, incorrectApiStart);
    const partWithApi = correctedApiPart.substring(incorrectApiStart);
    
    // 找到API端点定义的结束位置（查找下一个非缩进行）
    let lines = partWithApi.split('\n');
    let apiEndIndex = 1; // 从第二行开始查找
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() !== '' && !lines[i].startsWith('  ') && lines[i].match(/^\w/)) {
        // 找到了下一个顶级键
        apiEndIndex = i;
        break;
      }
    }
    
    // 提取API定义部分
    const apiDefinition = lines.slice(0, apiEndIndex).join('\n');
    // 移除API定义部分
    const remainingPart = lines.slice(apiEndIndex).join('\n');
    
    // 重构API部分
    correctedApiPart = partBeforeApi + remainingPart;
    
    // 现在将正确的API端点定义添加到API部分的末尾（在components部分之前）
    // 找到最后一个API端点的结束位置
    const lastApiEnd = correctedApiPart.lastIndexOf('\n  /api/');
    if (lastApiEnd !== -1) {
      // 找到该API端点的结束位置
      const afterLastApi = correctedApiPart.substring(lastApiEnd);
      const beforeLastApi = correctedApiPart.substring(0, lastApiEnd);
      
      // 重新组合内容
      content = beforeLastApi + '\n' + apiDefinition + afterLastApi + componentsPart;
    } else {
      // 如果没找到其他API端点，直接添加到API部分末尾
      content = correctedApiPart.trim() + '\n' + apiDefinition + '\n\n' + componentsPart;
    }
  } else {
    // 如果没有找到错误插入的API，只需重新组合
    content = correctedApiPart + componentsPart;
  }

  // 写回文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ openapi.yaml 文件结构已修复');
} else {
  console.error('❌ 未找到components部分');
}