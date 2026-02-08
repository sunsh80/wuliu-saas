// 修复openapi.yaml文件的结构
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 找到components部分的开始位置
const componentsIndex = content.indexOf('components:');

if (componentsIndex !== -1) {
  // 提取API路径部分和components部分
  const apiPart = content.substring(0, componentsIndex);
  const componentsPart = content.substring(componentsIndex);

  // 查找错误插入的API端点部分
  const incorrectInsertion = `
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

  // 从apiPart中移除错误插入的部分
  let correctedApiPart = apiPart.replace(incorrectInsertion, '');

  // 找到最后一个API端点的位置，通常是匹配相关的API
  const lastApiEndpointIndex = correctedApiPart.lastIndexOf('  /api/matching/get-quote-suggestions:');

  if (lastApiEndpointIndex !== -1) {
    // 在最后一个API端点后插入新的API端点
    const beforeLastApi = correctedApiPart.substring(0, lastApiEndpointIndex);
    const afterLastApi = correctedApiPart.substring(lastApiEndpointIndex);

    // 重新构建内容
    content = beforeLastApi + afterLastApi + '\n' + incorrectInsertion + '\n' + componentsPart;
  } else {
    // 如果没找到匹配的API，就在API部分末尾添加
    content = correctedApiPart + '\n' + incorrectInsertion + '\n' + componentsPart;
  }

  // 写回文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ openapi.yaml 文件结构已修复');
} else {
  console.error('❌ 未找到components部分');
}