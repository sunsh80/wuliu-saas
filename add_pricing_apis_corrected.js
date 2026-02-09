const fs = require('fs');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\\\Users\\\\Administrator\\\\Desktop\\\\wuliu_project\\\\backend\\\\openapi.yaml';
let content = fs.readFileSync(openapiPath, 'utf8');

// 定义价格API端点，严格按照现有格式
const pricingEndpoints = `  /api/admin/pricing-rules:
    get:
      tags:
        - admin-pricing
      summary: 获取平台定价规则列表
      operationId: listPlatformPricingRules
      security:
        - AdminSessionAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: 页码
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
          description: 每页数量
        - name: active
          in: query
          schema:
            type: boolean
          description: 是否只返回激活的规则
      responses:
        '200':
          description: 定价规则列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PricingRule'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
    post:
      tags:
        - admin-pricing
      summary: 创建平台定价规则
      operationId: createPlatformPricingRule
      security:
        - AdminSessionAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePricingRuleRequest'
      responses:
        '201':
          description: 定价规则创建成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "平台定价规则创建成功"
                  data:
                    $ref: '#/components/schemas/PricingRule'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/admin/pricing-rules/{id}:
    get:
      tags:
        - admin-pricing
      summary: 获取单个平台定价规则
      operationId: getPlatformPricingRule
      security:
        - AdminSessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: 定价规则ID
      responses:
        '200':
          description: 定价规则详情
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/PricingRule'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    put:
      tags:
        - admin-pricing
      summary: 更新平台定价规则
      operationId: updatePlatformPricingRule
      security:
        - AdminSessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: 定价规则ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePricingRuleRequest'
      responses:
        '200':
          description: 定价规则更新成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "平台定价规则更新成功"
                  data:
                    $ref: '#/components/schemas/PricingRule'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
        '500':
          $ref: '#/components/responses/InternalServerError'
    delete:
      tags:
        - admin-pricing
      summary: 删除平台定价规则
      operationId: deletePlatformPricingRule
      security:
        - AdminSessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: 定价规则ID
      responses:
        '200':
          description: 定价规则删除成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "平台定价规则删除成功"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
        '500':
          $ref: '#/components/responses/InternalServerError'

`;

// 使用正确的字符串格式查找
const pathsStart = content.indexOf('paths:\\n');
if (pathsStart !== -1) {
  // 找到paths部分的结束位置（在下一个顶级部分之前，通常是components:）
  const componentsStart = content.indexOf('\\ncomponents:', pathsStart);
  if (componentsStart !== -1) {
    // 在components之前插入新的API端点
    const newContent = content.substring(0, componentsStart) + pricingEndpoints + content.substring(componentsStart);
    fs.writeFileSync(openapiPath, newContent);
    console.log('✅ 价格API端点已添加到paths部分');
  } else {
    // 如果没有找到components部分，就添加到文件末尾
    fs.appendFileSync(openapiPath, '\\n' + pricingEndpoints);
    console.log('✅ 价格API端点已追加到文件末尾');
  }
} else {
  console.log('❌ 未找到paths部分');
  
  // 尝试使用另一种格式查找
  const pathsStartAlt = content.indexOf('paths:');  // 不带换行符
  if (pathsStartAlt !== -1) {
    console.log('找到替代格式的paths部分');
    // 找到下一个换行符
    const nextNewline = content.indexOf('\\n', pathsStartAlt);
    if (nextNewline !== -1) {
      const insertPos = content.indexOf('\\ncomponents:', nextNewline);
      if (insertPos !== -1) {
        const newContent = content.substring(0, insertPos) + pricingEndpoints + content.substring(insertPos);
        fs.writeFileSync(openapiPath, newContent);
        console.log('✅ 价格API端点已添加到paths部分（使用替代格式）');
      }
    }
  }
}

console.log('✅ 价格API端点添加完成');