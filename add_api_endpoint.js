// 添加API端点到OpenAPI规范的脚本
const fs = require('fs');
const path = require('path');

// 读取openapi.yaml文件
const filePath = path.join(__dirname, 'backend/openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

// 找到components部分的位置
const componentsIndex = content.indexOf('components:');

if (componentsIndex !== -1) {
  // 在components部分之前插入新的API端点定义
  const beforeComponents = content.substring(0, componentsIndex);
  const afterComponents = content.substring(componentsIndex);
  
  // 新的API端点定义
  const newApiEndpoint = `
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

  // 组合新内容
  const newContent = beforeComponents + newApiEndpoint + afterComponents;
  
  // 写回文件
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log('✅ 新的API端点已成功添加到OpenAPI规范中');
} else {
  console.error('❌ 未找到components部分');
}