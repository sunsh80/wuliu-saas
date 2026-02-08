// 将缺失的API端点添加到openapi.yaml文件
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 找到components部分的位置
const componentsIndex = content.indexOf('\ncomponents:');

if (componentsIndex !== -1) {
  // 分割内容
  const beforeComponents = content.substring(0, componentsIndex);
  const afterComponents = content.substring(componentsIndex);

  // 定义所有缺失的API端点
  const missingEndpoints = `
  /api/health:
    get:
      tags:
        - public
      summary: 健康检查
      operationId: healthCheck
      description: 检查API服务是否正常运行。
      responses:
        '200':
          description: 服务健康状态
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "OK"
                  service:
                    type: string
                    example: "【沈阳战旗】数孪智运无人物流SaaS平台 API"
                  time:
                    type: string
                    format: date-time
                    example: "2026-02-05T10:35:00Z"
                  version:
                    type: string
                    example: "1.0.0"

  /api/setup/status:
    get:
      tags:
        - setup
      summary: 检查平台初始化状态
      operationId: getSetupStatus
      description: 检查平台是否已完成初始化（是否存在管理员账户）。
      responses:
        '200':
          description: 平台初始化状态
          content:
            application/json:
              schema:
                type: object
                properties:
                  initialized:
                    type: boolean
                    example: true
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/setup/admin:
    post:
      tags:
        - setup
      summary: 创建首个平台管理员账户
      operationId: createFirstAdmin
      description: 在平台初始化时创建首个管理员账户。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
                - email
                - platform_name
              properties:
                username:
                  $ref: '#/components/schemas/Username'
                password:
                  type: string
                  minLength: 6
                email:
                  type: string
                  format: email
                platform_name:
                  type: string
                  description: "平台名称"
      responses:
        '201':
          description: 管理员创建成功
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
                    example: "管理员账户创建成功"
                  data:
                    type: object
                    properties:
                      adminId:
                        type: string
                        example: "admin_123"
        '400':
          description: 参数错误或平台已初始化
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/public/orders:
    post:
      tags:
        - public
      summary: 创建公共订单（匿名）
      operationId: createPublicOrder
      description: 允许匿名用户创建订单。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: 订单创建成功
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
                    example: "订单创建成功"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "ORD-12345"
                      tracking_number:
                        type: string
                        example: "ORD-20260205-001"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/public/orders/{id}:
    get:
      tags:
        - public
      summary: 获取公共订单信息
      operationId: fetchPublicOrder
      description: 通过订单ID和联系人电话获取订单信息（用于匿名订单查询）。
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: 订单ID或追踪号
        - name: contact_phone
          in: query
          required: true
          schema:
            type: string
          description: 联系人电话（用于验证订单归属）
      responses:
        '200':
          description: 订单信息
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/OrderItem'
        '404':
          $ref: '#/components/responses/NotFoundError'
        '401':
          description: 订单验证失败
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/tenant-web/register:
    post:
      tags:
        - auth
      summary: 租户注册
      operationId: registerTenantWeb
      description: 新租户注册账户。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - contact_phone
                - password
                - roles
              properties:
                contact_phone:
                  type: string
                  pattern: '^1[3-9][0-9]{9}$'
                password:
                  type: string
                  minLength: 6
                roles:
                  type: array
                  items:
                    type: string
                    enum: [customer, carrier]
                  minItems: 1
                name:
                  $ref: '#/components/schemas/Name'
                contact_person:
                  $ref: '#/components/schemas/Name'
                email:
                  type: string
                  format: email
                address:
                  $ref: '#/components/schemas/Address'
      responses:
        '201':
          description: 注册成功
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
                    example: "租户注册成功"
                  data:
                    type: object
                    properties:
                      tenant_id:
                        type: string
                        example: "tenant_123"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '409':
          description: 电话号码已存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/tenant-web/login:
    post:
      tags:
        - auth
      summary: 租户登录
      operationId: loginTenantWeb
      description: 租户使用手机号和密码登录。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone
                - password
              properties:
                phone:
                  type: string
                  pattern: '^1[3-9][0-9]{9}$'
                password:
                  type: string
      responses:
        '200':
          description: 登录成功
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
                    example: "登录成功"
                  data:
                    type: object
                    properties:
                      token:
                        type: string
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      user:
                        type: object
                        properties:
                          id:
                            type: string
                            example: "tenant_123"
                          name:
                            type: string
                            example: "Example Tenant"
                          roles:
                            type: array
                            items:
                              type: string
                              enum: [customer, carrier]
        '401':
          description: 登录失败
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/tenant-web/profile:
    get:
      tags:
        - auth
      summary: 获取租户资料
      operationId: getTenantProfile
      security:
        - TenantSessionAuth: []
      responses:
        '200':
          description: 租户资料
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TenantProfile'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/tenant-web/profile/roles:
    get:
      tags:
        - auth
      summary: 获取租户角色
      operationId: getTenantRoles
      security:
        - TenantSessionAuth: []
      responses:
        '200':
          description: 租户角色列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: string
                      enum: [customer, carrier]
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/pc-tenant/apply:
    post:
      tags:
        - auth
      summary: PC端租户申请入驻
      operationId: applyPcTenant
      description: PC端用户申请成为租户。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TenantApplication'
      responses:
        '201':
          description: 申请提交成功
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
                    example: "入驻申请已提交"
                  data:
                    type: object
                    properties:
                      application_id:
                        type: string
                        example: "app_123"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '409':
          description: 邮箱或手机号已存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/customer/orders:
    post:
      tags:
        - customer-order
      summary: 客户创建订单
      operationId: createCustomerOrder
      security:
        - TenantSessionAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: 订单创建成功
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
                    example: "订单创建成功"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "ORD-12345"
                      tracking_number:
                        type: string
                        example: "ORD-20260205-001"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/customer/orders:
    get:
      tags:
        - customer-order
      summary: 获取客户订单列表
      operationId: listCustomerOrders
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
      responses:
        '200':
          description: 订单列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/customer/orders/{order_id}:
    get:
      tags:
        - customer-order
      summary: 获取客户订单详情
      operationId: getCustomerOrder
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 订单详情
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/OrderItem'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/customer/orders/{order_id}:
    put:
      tags:
        - customer-order
      summary: 更新客户订单
      operationId: updateCustomerOrder
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sender_info:
                  type: object
                receiver_info:
                  type: object
                weight_kg:
                  type: number
                description:
                  type: string
      responses:
        '200':
          description: 订单更新成功
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
                    example: "订单更新成功"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/customer/orders/{order_id}:
    delete:
      tags:
        - customer-order
      summary: 删除客户订单
      operationId: deleteCustomerOrder
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 订单删除成功
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
                    example: "订单删除成功"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/customer/orders/{order_id}/bind:
    post:
      tags:
        - customer-order
      summary: 绑定订单到客户
      operationId: bindOrderToCustomer
      description: 将订单与当前客户租户绑定。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 订单绑定成功
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
                    example: "订单绑定成功"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "order_123"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/customer/orders/{order_id}/award:
    post:
      tags:
        - customer-order
      summary: 客户授予订单给承运商
      operationId: awardOrderToCarrier
      description: 客户从报价中选择并授予订单给承运商。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - carrier_tenant_id
              properties:
                carrier_tenant_id:
                  type: string
                  description: "选中的承运商租户ID"
      responses:
        '200':
          description: 订单授予成功
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
                    example: "订单已授予承运商"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "order_123"
                      carrier_tenant_id:
                        type: string
                        example: "carrier_456"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/customer/orders/{order_id}/quotes:
    get:
      tags:
        - customer-order
      summary: 获取订单的报价列表
      operationId: getOrderQuotes
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
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
                      order_id:
                        type: string
                        example: "order_123"
                      quotes:
                        type: array
                        items:
                          $ref: '#/components/schemas/QuoteItem'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/carrier/orders:
    get:
      tags:
        - carrier-order
      summary: 获取承运商订单列表
      operationId: listCarrierOrders
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
          description: 状态筛选
          required: false
          schema:
            type: string
            enum: [pending_claim, available, claimed, quoted, awarded, dispatched, in_transit, delivered]
      responses:
        '200':
          description: 承运商订单列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/carrier/orders/{order_id}/claim:
    put:
      tags:
        - carrier-order
      summary: 承运商认领订单
      operationId: claimCarrierOrder
      description: 承运商认领一个可认领的订单。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
          description: 订单ID
      responses:
        '200':
          description: 认领成功
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
                    example: "订单认领成功"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "order_123"
                      carrier_id:
                        type: string
                        example: "carrier_456"
        '400':
          description: 订单状态不允许认领
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
        '409':
          description: 订单已被其他承运商认领
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/carrier/orders/{order_id}/quote:
    post:
      tags:
        - carrier-order
      summary: 承运商为订单提交报价
      operationId: submitCarrierQuote
      description: 承运商提交一个报价（价格、预计送达时间、备注）给指定的订单。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: integer
          description: 要报价的订单ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                price:
                  type: number
                  format: float
                  minimum: 0.01
                  description: 报价金额
                  example: 150.75
                deliveryTime:
                  type: string
                  description: 预计送达时间 (ISO 8601 格式或自定义格式)
                  example: "2024-05-25T18:00:00Z"
                remarks:
                  type: string
                  maxLength: 500
                  description: 报价备注
                  example: "自有车辆,24小时内装车"
              required:
                - price
                - deliveryTime
      responses:
        '201':
          description: 报价提交成功
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
                    example: "报价提交成功"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: integer
                        example: 123
                      quote:
                        type: object
                        properties:
                          price:
                            type: number
                            format: float
                            example: 150.75
                          deliveryTime:
                            type: string
                            example: "2024-05-25T18:00:00Z"
                          remarks:
                            type: string
                            example: "自有车辆,24小时内装车"
                      carrierId:
                        type: integer
                        example: 456
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          description: 订单未找到或不允许报价
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: 承运商已为此订单提交过报价
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/carrier/orders/{order_id}/start-delivery:
    put:
      tags:
        - carrier-order
      summary: 承运商开始配送
      operationId: startDelivery
      description: 承运商标记订单开始配送（状态变为in_transit）。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
          description: 订单ID
      responses:
        '200':
          description: 配送开始成功
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
                    example: "配送已开始"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "order_123"
                      status:
                        type: string
                        example: "in_transit"
        '400':
          description: 订单状态不允许开始配送
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/carrier/orders/{order_id}/complete:
    put:
      tags:
        - carrier-order
      summary: 承运商完成订单
      operationId: completeCarrierOrder
      description: 承运商标记订单已完成（状态变为delivered）。
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
          description: 订单ID
      responses:
        '200':
          description: 订单完成成功
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
                    example: "订单已完成"
                  data:
                    type: object
                    properties:
                      order_id:
                        type: string
                        example: "order_123"
                      status:
                        type: string
                        example: "delivered"
        '400':
          description: 订单状态不允许完成
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/tenant-web/orders/pending:
    get:
      tags:
        - auth
      summary: 获取可认领的订单列表（状态=pending_claim或available）
      operationId: listPendingOrders
      security:
        - TenantSessionAuth: []
      responses:
        '200':
          description: 可认领订单列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/tenant-web/orders/{order_id}/claim:
    put:
      tags:
        - auth
      summary: 租户认领订单
      operationId: claimOrder
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 认领成功
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
                    example: "订单认领成功"
        '400':
          $ref: '#/components/responses/ForbiddenError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/tenant-web/quotes:
    get:
      tags:
        - tenant-web-quote
      summary: 获取承运商报价列表
      operationId: listCarrierQuotes
      description: 获取当前承运商提交的所有报价列表，支持分页和状态筛选。
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

  // 将缺失的API端点添加到文件中
  const newContent = beforeComponents + missingEndpoints + afterComponents;
  
  // 写回文件
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log('✅ 所有缺失的API端点已添加到openapi.yaml文件中');
} else {
  console.error('❌ 未找到components部分');
}