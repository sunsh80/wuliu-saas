const fs = require('fs');
const readline = require('readline');

// 从原始备份中提取正确的API定义
async function extractValidApis() {
  const backupPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_full_backup.yaml';
  const outputFilePath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  
  const readStream = fs.createReadStream(backupPath, 'utf-8');
  const writeStream = fs.createWriteStream(outputFilePath, 'utf-8');
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  
  // 首先写入文件头部
  writeStream.write(`openapi: 3.0.0
info:
  title: 物流管理系统 API
  version: 1.0.0
  description: 物流管理系统的API接口

servers:
  - url: http://localhost:3000
    description: 开发环境

paths:
`);
  
  let inPathsSection = false;
  let currentPath = '';
  let currentMethod = '';
  let skipCurrentOperation = false;
  let operationCount = 0;
  let skippedOperations = [];
  
  for await (const line of rl) {
    // 查找paths部分
    if (line.trim() === 'paths:') {
      inPathsSection = true;
      continue; // 已经在上面写了paths:
    }
    
    if (!inPathsSection) {
      continue; // 跳过非paths部分
    }
    
    // 检测路径定义
    if (line.trim().startsWith('/') && !line.trim().startsWith('-')) {
      currentPath = line.trim().split(':')[0]; // 获取路径名
      writeStream.write(line + '\n');
      continue;
    }
    
    // 检测HTTP方法定义
    if (line.trim().match(/^(get|post|put|delete|patch|head|options|trace):/i)) {
      currentMethod = line.trim().split(':')[0].toLowerCase(); // 获取方法名
      writeStream.write(line + '\n');
      continue;
    }
    
    // 检测operationId
    if (line.trim().startsWith('operationId:')) {
      const operationId = line.trim().substring('operationId:'.length).trim();
      
      // 检查这个操作ID是否有对应的处理函数
      const hasHandler = await checkIfHandlerExists(operationId);
      
      if (!hasHandler) {
        // 跳过这个操作及其所有内容，直到下一个路径或方法定义
        skipCurrentOperation = true;
        skippedOperations.push(operationId);
        console.log(`跳过无处理函数的操作: ${operationId}`);
      } else {
        writeStream.write(line + '\n');
        operationCount++;
      }
      continue;
    }
    
    // 如果在跳过当前操作，则跳过所有缩进更深的行
    if (skipCurrentOperation) {
      // 检查是否是新的路径或方法定义，如果是则停止跳过
      if (line.trim().startsWith('/') || 
          line.trim().match(/^(get|post|put|delete|patch|head|options|trace):/i)) {
        skipCurrentOperation = false;
      }
      // 否则继续跳过当前行
      continue;
    }
    
    // 写入当前行（如果不是在跳过操作的情况下）
    writeStream.write(line + '\n');
  }
  
  // 写入组件定义
  writeStream.write(`
components:
  schemas:
    SingleUserResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            user:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                username:
                  type: string
                  example: "admin"
                email:
                  type: string
                  example: "admin@example.com"
                name:
                  type: string
                  example: "Administrator"
                role:
                  type: string
                  example: "admin"
                type:
                  type: string
                  example: "admin"
                organization_id:
                  type: integer
                  example: 1
                organization_name:
                  type: string
                  example: "System Admin"
                organization_type:
                  type: string
                  example: "platform"

  responses:
    UnauthorizedError:
      description: 未授权访问
      content:
        application/json:
          schema:
            type: object
            properties:
              success:
                type: boolean
                example: false
              error:
                type: string
                example: "Unauthorized"
  
  securitySchemes:
    AdminSessionAuth:
      type: apiKey
      in: header
      name: Authorization
      description: 管理员会话认证令牌
`);

  writeStream.end();
  
  console.log(`\\n处理完成！`);
  console.log(`- 保留了 ${operationCount} 个有处理函数的操作`);
  console.log(`- 跳过了 ${skippedOperations.length} 个无处理函数的操作`);
  if (skippedOperations.length > 0) {
    console.log(`- 跳过操作列表: ${skippedOperations.join(', ')}`);
  }
  console.log(`\\n新的 openapi.yaml 文件已创建，只包含有对应处理函数的API端点。`);
}

// 检查操作ID是否有对应的处理函数
async function checkIfHandlerExists(operationId) {
  // 将operationId转换为文件名格式（小写，驼峰转连字符）
  const fileName = convertOperationIdToFileName(operationId);
  
  // 检查各种可能的路径
  const possiblePaths = [
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\auth\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\order\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\pricing\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\reports\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\tenant-management\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\tenants\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\user\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\admin\\vehicles\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\carrier\\order\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\carrier\\pricing\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\customer\\order\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\public\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\setup\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\tenant\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\tenant-web\\order\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\tenant-web\\quotes\\${fileName}.js`,
    `C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\${fileName}.js`,
  ];
  
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return true;
    }
  }
  
  // 特殊处理：healthCheck在根目录
  if (operationId === 'healthCheck') {
    return fs.existsSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\api\\handlers\\healthCheck.js');
  }
  
  return false;
}

// 将operationId转换为文件名格式
function convertOperationIdToFileName(operationId) {
  // 将驼峰命名转换为短横线命名
  return operationId
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

extractValidApis().catch(console.error);