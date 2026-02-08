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

  // 查找API路径部分的最后一个API端点（在components部分之前）
  // 找到API路径定义的结束位置
  const lines = apiPart.split('\n');
  
  // 找到错误插入的API端点部分
  let correctedLines = [];
  let skipBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('/api/tenant-web/quotes:')) {
      // 开始跳过错误插入的块
      skipBlock = true;
    }
    
    if (skipBlock) {
      // 检查是否是块的结束
      if (lines[i].trim() === '' && i + 1 < lines.length && 
          lines[i + 1].trim() !== '' && !lines[i + 1].startsWith('  ') && 
          lines[i + 1].match(/^\w/)) {
        // 如果下一行不是缩进的且以字母开头，说明是新部分的开始
        skipBlock = false;
      }
    } else {
      correctedLines.push(lines[i]);
    }
  }
  
  // 重建API部分
  const correctedApiPart = correctedLines.join('\n');
  
  // 定义正确的API端点，需要正确缩进
  const correctApiEndpoint = `
  /api/tenant-web/quotes:
    get:
      tags:
        - tenant-web-quote
      summary: 获取承运商报价列表
      description: 获取当前承运商提交的所有报价列表，支持分页和状态筛选。
      operationId: listCarrierQuotes
      security:
        - TenantSessionAuth: []
      parameters:
        - name: page
          in: query
          description: 页码
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          description: 每页数量
          required: false
          schema:
            type: integer
            default: 10
        - name: status
          in: query
          description: 状态筛选 (pending, approved, rejected, active, inactive)
          required: false
          schema:
            type: string
      responses:
        '200':
          description: 报价列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      quotes:
                        type: array
                        items:
                          $ref: '#/components/schemas/QuoteItem'
                      pagination:
                        type: object
                        properties:
                          current_page:
                            type: integer
                            example: 1
                          total_pages:
                            type: integer
                            example: 5
                          total_items:
                            type: integer
                            example: 50
                          per_page:
                            type: integer
                            example: 10
        '401':
          $ref: '#/components/responses/UnauthorizedError'
`;

  // 重新组合文件内容
  const newContent = correctedApiPart + correctApiEndpoint + '\n' + componentsPart;
  
  // 写回文件
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ openapi.yaml 文件结构已修复');
} else {
  console.error('❌ 未找到components部分');
}