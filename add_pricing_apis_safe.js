const fs = require('fs');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
let content = fs.readFileSync(openapiPath, 'utf8');

// 定义价格API端点，严格按照现有格式
const pricingEndpoints = `
  /api/admin/pricing-rules:
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

// 找到paths部分的结束位置（在components部分之前）
const pathsStart = content.indexOf('paths:\\n');
if (pathsStart !== -1) {
  const componentsStart = content.indexOf('\\ncomponents:', pathsStart);
  if (componentsStart !== -1) {
    // 在components部分之前插入新的API端点
    const newContent = content.substring(0, componentsStart) + pricingEndpoints + content.substring(componentsStart);
    fs.writeFileSync(openapiPath, newContent);
    console.log('✅ 价格API端点已添加到paths部分');
  } else {
    console.log('❌ 未找到components部分');
  }
} else {
  console.log('❌ 未找到paths部分');
}

// 添加所需的schema定义
let updatedContent = fs.readFileSync(openapiPath, 'utf8');

// 检查是否需要添加schema定义
if (!updatedContent.includes('PricingRule')) {
  // 找到schemas部分并添加定义
  const schemasStart = updatedContent.indexOf('schemas:\\n');
  if (schemasStart !== -1) {
    const schemasToAdd = `    PricingRule:
      type: object
      properties:
        id:
          type: integer
          example: 1
        rule_name:
          type: string
          example: "标准定价规则"
        base_price:
          type: number
          example: 10.0
        price_per_km:
          type: number
          example: 2.5
        price_per_hour:
          type: number
          example: 5.0
        price_per_kg:
          type: number
          example: 1.0
        cold_storage_surcharge:
          type: number
          example: 0.5
        peak_hour_multiplier:
          type: number
          example: 1.5
        off_peak_hour_multiplier:
          type: number
          example: 0.8
        weather_multiplier:
          type: number
          example: 1.2
        min_price:
          type: number
          example: 5.0
        max_price:
          type: number
          example: 1000.0
        time_slot_rules:
          type: object
          example: {}
        region_rules:
          type: object
          example: {}
        vehicle_type_rules:
          type: object
          example: {}
        active:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
          example: "2026-01-25T15:30:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2026-01-25T15:30:00Z"
    CreatePricingRuleRequest:
      type: object
      required:
        - rule_name
      properties:
        rule_name:
          type: string
          example: "标准定价规则"
          description: "定价规则名称"
        base_price:
          type: number
          example: 10.0
          description: "基础价格"
        price_per_km:
          type: number
          example: 2.5
          description: "每公里价格"
        price_per_hour:
          type: number
          example: 5.0
          description: "每小时价格"
        price_per_kg:
          type: number
          example: 1.0
          description: "每公斤价格"
        cold_storage_surcharge:
          type: number
          example: 0.5
          description: "冷藏附加费"
        peak_hour_multiplier:
          type: number
          example: 1.5
          description: "高峰时段倍率"
        off_peak_hour_multiplier:
          type: number
          example: 0.8
          description: "非高峰时段倍率"
        weather_multiplier:
          type: number
          example: 1.2
          description: "天气倍率"
        min_price:
          type: number
          example: 5.0
          description: "最低价格"
        max_price:
          type: number
          example: 1000.0
          description: "最高价格"
        time_slot_rules:
          type: object
          description: "时段规则"
        region_rules:
          type: object
          description: "地区规则"
        vehicle_type_rules:
          type: object
          description: "车型规则"
        active:
          type: boolean
          example: true
          description: "是否激活"
    UpdatePricingRuleRequest:
      type: object
      properties:
        rule_name:
          type: string
          example: "标准定价规则"
          description: "定价规则名称"
        base_price:
          type: number
          example: 10.0
          description: "基础价格"
        price_per_km:
          type: number
          example: 2.5
          description: "每公里价格"
        price_per_hour:
          type: number
          example: 5.0
          description: "每小时价格"
        price_per_kg:
          type: number
          example: 1.0
          description: "每公斤价格"
        cold_storage_surcharge:
          type: number
          example: 0.5
          description: "冷藏附加费"
        peak_hour_multiplier:
          type: number
          example: 1.5
          description: "高峰时段倍率"
        off_peak_hour_multiplier:
          type: number
          example: 0.8
          description: "非高峰时段倍率"
        weather_multiplier:
          type: number
          example: 1.2
          description: "天气倍率"
        min_price:
          type: number
          example: 5.0
          description: "最低价格"
        max_price:
          type: number
          example: 1000.0
          description: "最高价格"
        time_slot_rules:
          type: object
          description: "时段规则"
        region_rules:
          type: object
          description: "地区规则"
        vehicle_type_rules:
          type: object
          description: "车型规则"
        active:
          type: boolean
          description: "是否激活"
`;
    
    // 找到schemas部分的结束位置（在responses之前）
    const responsesStart = updatedContent.indexOf('\\n  responses:', schemasStart);
    if (responsesStart !== -1) {
      // 在responses之前插入新的schema定义
      updatedContent = updatedContent.substring(0, responsesStart) + schemasToAdd + updatedContent.substring(responsesStart);
    } else {
      // 如果没找到responses，就插入到schemas部分的末尾
      updatedContent = updatedContent.substring(0, schemasStart + 9) + schemasToAdd + '\\n' + updatedContent.substring(schemasStart + 9); // +9 for 'schemas:\n'
    }
    
    fs.writeFileSync(openapiPath, updatedContent);
    console.log('✅ 价格相关的Schema定义已添加');
  }
}

console.log('✅ 价格API端点添加完成');