# 物流系统完整开发文档

## 1. 项目概述

### 1.1 项目目标
开发一个支持多承运商、多车辆、多订单的物流竞价平台，包含订单管理、车辆管理、风控管理、抽佣管理等完整功能模块。

### 1.2 核心特性
- **车辆维度管理**：以车辆为单位进行订单限制和管理
- **多承运商竞价**：支持多个承运商对同一订单进行报价
- **风控管理**：完善的违规处罚和申诉机制
- **抽佣管理**：灵活的抽佣规则配置

## 2. 数据库设计

### 2.1 核心表结构

#### 2.1.1 orders 表
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_tenant_id INTEGER NOT NULL, -- 客户租户ID
  carrier_id INTEGER, -- 最终选中的承运商ID
  vehicle_id INTEGER, -- 最终选中的车辆ID
  tenant_id INTEGER, -- 租户ID
  tracking_number TEXT UNIQUE NOT NULL, -- 订单号
  sender_info TEXT NOT NULL, -- 发货人信息
  receiver_info TEXT NOT NULL, -- 收货人信息
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','pending_claim', 'claimed', 'quoted', 'awarded', 'dispatched', 'in_transit', 'delivered', 'cancelled')), -- 订单状态
  completed_at TEXT, -- 完成时间
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  quote_price REAL, -- 报价价格
  quote_delivery_time TEXT, -- 预计送达时间
  quote_remarks TEXT, -- 报价备注
  quote_deadline TEXT, -- 报价截止时间
  customer_phone TEXT, -- 客户电话
  weight_kg REAL, -- 重量(kg)
  volume_m3 REAL, -- 体积(m³)
  required_delivery_time TEXT, -- 要求送达时间
  description TEXT, -- 描述
  type_user INTEGER DEFAULT NULL,
  cargo_type TEXT, -- 货物类型
  addons_config TEXT, -- 附加服务配置
  addons_total REAL DEFAULT 0.0, -- 附加费总额
  addons_status TEXT DEFAULT 'pending' CHECK (addons_status IN ('pending', 'confirmed', 'rejected')), -- 附加费状态
  addons_confirmation_time TEXT, -- 附加费确认时间
  FOREIGN KEY (customer_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles (id) ON DELETE SET NULL
);
```

#### 2.1.2 order_assignments 表
```sql
CREATE TABLE order_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  carrier_id INTEGER NOT NULL, -- 承运商ID
  vehicle_id INTEGER NOT NULL, -- 车辆ID
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'quoted', 'rejected', 'cancelled')), -- 分配状态
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE CASCADE
);
```

#### 2.1.3 tenant_vehicles 表
```sql
CREATE TABLE tenant_vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL, -- 租户ID
  plate_number TEXT NOT NULL UNIQUE, -- 车牌号
  type TEXT NOT NULL, -- 车型
  length REAL, -- 长度
  width REAL, -- 宽度
  height REAL, -- 高度
  max_weight REAL, -- 最大载重
  volume REAL, -- 体积
  status TEXT DEFAULT 'active', -- 状态
  driver_name TEXT, -- 司机姓名
  driver_phone TEXT, -- 司机电话
  image_url TEXT, -- 图片URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_active_orders INTEGER DEFAULT 0, -- 当前活跃订单数
  max_active_orders INTEGER DEFAULT 3, -- 最大活跃订单数
  penalty_points INTEGER DEFAULT 0, -- 处罚积分
  penalty_expiry_time TEXT, -- 处罚到期时间
  commission_increase_percent REAL DEFAULT 0, -- 抽成增加百分比
  commission_increase_expiry TEXT, -- 抽成增加到期时间
  suspension_reason TEXT, -- 暂停原因
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);
```

#### 2.1.4 quotes 表
```sql
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  carrier_id INTEGER NOT NULL, -- 承运商ID
  quote_price REAL NOT NULL, -- 报价
  quote_delivery_time TEXT NOT NULL, -- 预计送达时间
  quote_remarks TEXT, -- 报价备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 2.1.5 violation_records 表
```sql
CREATE TABLE violation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  violation_type TEXT NOT NULL, -- 违规类型
  target_type TEXT NOT NULL CHECK (target_type IN ('carrier', 'customer')), -- 违规对象类型
  target_id INTEGER NOT NULL, -- 承运商或客户ID
  description TEXT NOT NULL, -- 违规描述
  penalty_points INTEGER DEFAULT 0, -- 处罚积分
  evidence TEXT, -- 证据
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected', 'appeal_approved', 'appeal_rejected')), -- 状态
  appeal_reason TEXT, -- 申诉理由
  processed_by INTEGER, -- 处理人ID
  processed_at TEXT, -- 处理时间
  notes TEXT, -- 处理备注
  created_by INTEGER NOT NULL, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  vehicle_id INTEGER, -- 车辆ID
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE SET NULL
);
```

#### 2.1.6 commission_rules 表
```sql
CREATE TABLE commission_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL, -- 规则名称
  base_commission_percent REAL NOT NULL DEFAULT 10.0, -- 基础抽成百分比
  min_commission_percent REAL DEFAULT 0.0, -- 最小抽成百分比
  max_commission_percent REAL DEFAULT 50.0, -- 最大抽成百分比
  description TEXT, -- 规则描述
  is_active BOOLEAN DEFAULT 1, -- 是否激活
  created_by INTEGER, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 2.1.7 vehicle_commission_overrides 表
```sql
CREATE TABLE vehicle_commission_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL, -- 车辆ID
  override_type TEXT NOT NULL CHECK (override_type IN ('fixed', 'percentage', 'multiplier')), -- 覆盖类型
  override_value REAL NOT NULL, -- 覆盖值
  reason TEXT, -- 调整原因
  effective_from TEXT NOT NULL DEFAULT (datetime('now')), -- 生效时间
  effective_until TEXT, -- 失效时间
  is_active BOOLEAN DEFAULT 1, -- 是否激活
  created_by INTEGER, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 2.1.8 commission_history 表
```sql
CREATE TABLE commission_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  vehicle_id INTEGER, -- 车辆ID
  base_commission_percent REAL NOT NULL, -- 基础抽成比例
  override_commission_percent REAL, -- 覆盖抽成比例
  final_commission_percent REAL NOT NULL, -- 最终抽成比例
  calculated_amount REAL NOT NULL, -- 计算得出的抽成金额
  applied_rule_id INTEGER, -- 应用的规则ID
  adjustment_reason TEXT, -- 调整原因
  processed_by INTEGER, -- 处理人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (applied_rule_id) REFERENCES commission_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 2.1.9 wallets 表
```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('platform', 'carrier', 'customer')), -- 钱包拥有者类型
  owner_id INTEGER NOT NULL, -- 钱包拥有者ID
  balance REAL NOT NULL DEFAULT 0.0, -- 余额
  frozen_amount REAL NOT NULL DEFAULT 0.0, -- 冻结金额
  available_balance REAL NOT NULL GENERATED ALWAYS AS (balance - frozen_amount) STORED, -- 可用余额（计算字段）
  currency TEXT DEFAULT 'CNY', -- 货币类型
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')), -- 钱包状态
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### 2.1.10 wallet_transactions 表
```sql
CREATE TABLE wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL, -- 钱包ID
  order_id INTEGER, -- 订单ID（可选）
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'freeze', 'unfreeze', 'transfer')), -- 交易类型
  amount REAL NOT NULL, -- 交易金额
  balance_change REAL NOT NULL, -- 余额变动（正数为增加，负数为减少）
  description TEXT, -- 交易描述
  reference_id TEXT, -- 关联ID（如订单号、抽佣记录ID等）
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')), -- 交易状态
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);
```

#### 2.1.11 settlements 表
```sql
CREATE TABLE settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  carrier_wallet_id INTEGER NOT NULL, -- 承运商钱包ID
  platform_wallet_id INTEGER NOT NULL, -- 平台钱包ID
  gross_amount REAL NOT NULL, -- 订单总金额
  commission_amount REAL NOT NULL, -- 抽佣金额
  net_amount REAL NOT NULL, -- 承运商净收入
  settlement_status TEXT NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processing', 'completed', 'failed')), -- 结算状态
  commission_transaction_id INTEGER, -- 抽佣交易ID
  payment_transaction_id INTEGER, -- 支付交易ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (commission_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL
);
```

## 3. OpenAPI 规范 (openapi.yaml)

```yaml
openapi: 3.0.3
info:
  title: 多租户物流平台 API
  version: 1.0.2-safe 技术栈:Node.js + Express + SQLite + OpenAPI Backend 认证机制:express-session(基于 Cookie 的会话） 安全模型：通过 TenantSessionAuth 安全处理器校验 req.session.userId 多租户支持:tenants 表存储租户,users 表存储租户员工 & 小程序顾客
  description: |
    支持客户（下单方）与承运方（接单方）双角色的物流订单系统。
    - `/api/admin/...`：平台管理员
    - `/api/customer/...`：客户租户
    - `/api/carrier/...`：承运方租户
    - `/api/public/...`：公共接口
    🔹 本次增容(v1.0.2-safe):
    - 保留所有 v1.0.1 字段、路由、状态不变
    - 新增承运方能力画像（可选）
    - 租户本身可以在一定条件下转变为承运方，客户，仓库实体
    - 新增体积、时效等可选字段
    - 新增匹配相关接口（不改动原有 claim/award 流程）
    🔹 本次增容(v1.0.3-vehicle-based):
    - 支持车辆维度的订单管理
    - 支持多车竞价处理
    - 支持风控管理
    - 支持抽佣管理
servers:
  - url: http://localhost:3000
    description: 开发环境
tags:
  - name: setup
    description: 平台初始化（首次安装）
  - name: admin-auth
    description: 平台管理员 - 认证与会话
  - name: admin-user
    description: 平台管理员 - 用户管理
  - name: admin-tenant
    description: 平台管理员 - 租户管理
  - name: admin-order
    description: 平台管理员 - 订单管理
  - name: customer-order
    description: 客户租户 - 创建与查看自己的订单
  - name: carrier-order
    description: 承运方租户 - 认领、执行订单
  - name: public
    description: 公共接口（小程序使用，未来废弃）
  - name: auth
    description: 租户认证与会话
  - name: matching
    description: 智能匹配（新增，可选使用）
  - name: risk-control
    description: 风控管理
  - name: commission
    description: 抽佣管理
  - name: vehicle
    description: 车辆管理
  - name: wallet
    description: 钱包管理
  - name: settlement
    description: 结算管理

components:
  securitySchemes:
    AdminSessionAuth:
      type: apiKey
      in: cookie
      name: connect.sid
      description: 平台管理员登录后自动携带（由 Express Session 管理）
    TenantSessionAuth:
      type: apiKey
      in: cookie
      name: connect.sid
      description: 租户登录后自动携带（由 Express Session 管理）

  schemas:
    # ... (保持原有schemas定义)
    
    # 新增车辆相关schemas
    VehicleInfo:
      type: object
      properties:
        id:
          type: integer
        plate_number:
          type: string
        type:
          type: string
        length:
          type: number
        width:
          type: number
        height:
          type: number
        max_weight:
          type: number
        volume:
          type: number
        status:
          type: string
        driver_name:
          type: string
        driver_phone:
          type: string
        image_url:
          type: string
        current_active_orders:
          type: integer
        max_active_orders:
          type: integer
        penalty_points:
          type: integer
        commission_increase_percent:
          type: number
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    VehicleAssignment:
      type: object
      properties:
        id:
          type: integer
        order_id:
          type: integer
        carrier_id:
          type: integer
        vehicle_id:
          type: integer
        status:
          type: string
          enum: [assigned, quoted, rejected, cancelled]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CommissionRule:
      type: object
      properties:
        id:
          type: integer
        rule_name:
          type: string
        base_commission_percent:
          type: number
        min_commission_percent:
          type: number
        max_commission_percent:
          type: number
        description:
          type: string
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ViolationRecord:
      type: object
      properties:
        id:
          type: integer
        order_id:
          type: integer
        violation_type:
          type: string
        target_type:
          type: string
          enum: [carrier, customer]
        target_id:
          type: integer
        description:
          type: string
        penalty_points:
          type: integer
        status:
          type: string
          enum: [pending, processed, rejected, appeal_approved, appeal_rejected]
        created_at:
          type: string
          format: date-time
        processed_at:
          type: string
          format: date-time

    # 新增钱包相关schemas
    WalletInfo:
      type: object
      properties:
        id:
          type: integer
        owner_type:
          type: string
          enum: [platform, carrier, customer]
        owner_id:
          type: integer
        balance:
          type: number
        frozen_amount:
          type: number
        available_balance:
          type: number
        currency:
          type: string
        status:
          type: string
          enum: [active, frozen, closed]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    WalletBalance:
      type: object
      properties:
        id:
          type: integer
        balance:
          type: number

    WalletTransaction:
      type: object
      properties:
        id:
          type: integer
        wallet_id:
          type: integer
        order_id:
          type: integer
        transaction_type:
          type: string
          enum: [income, expense, freeze, unfreeze, transfer]
        amount:
          type: number
        balance_change:
          type: number
        description:
          type: string
        reference_id:
          type: string
        status:
          type: string
          enum: [pending, completed, failed, cancelled]
        created_at:
          type: string
          format: date-time
        processed_at:
          type: string
          format: date-time

    TransactionInfo:
      type: object
      properties:
        id:
          type: integer
        wallet_id:
          type: integer
        amount:
          type: number

paths:
  # ... (保持原有paths定义)
  
  # 新增车辆相关API
  /api/carrier/vehicles/available:
    get:
      tags:
        - vehicle
      summary: 获取承运商可用车辆
      operationId: getAvailableVehicles
      security:
        - TenantSessionAuth: []
      parameters:
        - name: weight
          in: query
          description: 订单重量
          required: false
          schema:
            type: number
        - name: volume
          in: query
          description: 订单体积
          required: false
          schema:
            type: number
        - name: cargo_type
          in: query
          description: 货物类型
          required: false
          schema:
            type: string
      responses:
        '200':
          description: 可用车辆列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      available_vehicles:
                        type: array
                        items:
                          $ref: '#/components/schemas/VehicleInfo'
                      summary:
                        type: object
                        properties:
                          total_vehicles:
                            type: integer
                          available_vehicles_count:
                            type: integer
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/carrier/orders/{order_id}/assign:
    post:
      tags:
        - carrier-order
      summary: 承运商为订单分配车辆
      operationId: assignVehicleToOrder
      security:
        - TenantSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                vehicle_id:
                  type: integer
                  description: 车辆ID
              required:
                - vehicle_id
      responses:
        '200':
          description: 分配成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  data:
                    $ref: '#/components/schemas/VehicleAssignment'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  # 新增风控管理API
  /api/admin/risk-control/violations:
    get:
      tags:
        - risk-control
      summary: 获取违规记录列表
      operationId: getViolationRecords
      security:
        - AdminSessionAuth: []
      parameters:
        - name: page
          in: query
          description: 页码
          required: false
          schema:
            type: integer
        - name: limit
          in: query
          description: 每页数量
          required: false
          schema:
            type: integer
        - name: violation_type
          in: query
          description: 违规类型
          required: false
          schema:
            type: string
        - name: status
          in: query
          description: 状态
          required: false
          schema:
            type: string
      responses:
        '200':
          description: 违规记录列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      records:
                        type: array
                        items:
                          $ref: '#/components/schemas/ViolationRecord'
                      pagination:
                        $ref: '#/components/schemas/PaginationInfo'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  # 新增抽佣管理API
  /api/admin/commission/vehicles/{vehicle_id}/override:
    post:
      tags:
        - commission
      summary: 设置车辆抽佣覆盖
      operationId: setVehicleCommissionOverride
      security:
        - AdminSessionAuth: []
      parameters:
        - name: vehicle_id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                override_type:
                  type: string
                  enum: [fixed, percentage, multiplier]
                  description: 覆盖类型
                override_value:
                  type: number
                  description: 覆盖值
                reason:
                  type: string
                  description: 调整原因
                effective_from:
                  type: string
                  format: date-time
                  description: 生效时间
                effective_until:
                  type: string
                  format: date-time
                  description: 失效时间
              required:
                - override_type
                - override_value
      responses:
        '201':
          description: 设置成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  data:
                    type: object
                    properties:
                      override:
                        $ref: '#/components/schemas/VehicleCommissionOverride'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /api/carrier/commission/info:
    get:
      tags:
        - commission
      summary: 获取承运商车辆抽佣信息
      operationId: getVehicleCommissionInfo
      security:
        - TenantSessionAuth: []
      responses:
        '200':
          description: 车辆抽佣信息
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      vehicles:
                        type: array
                        items:
                          type: object
                          properties:
                            vehicle:
                              $ref: '#/components/schemas/VehicleInfo'
                            current_effective_commission:
                              type: number
                            status_summary:
                              type: object
                              properties:
                                penalty_status:
                                  type: string
                                active_orders:
                                  type: integer
                                override_status:
                                  type: string
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  # 新增钱包相关API
  /api/wallets/me:
    get:
      tags:
        - wallet
      summary: 获取当前用户钱包信息
      operationId: getCurrentUserWallet
      security:
        - TenantSessionAuth: []
      responses:
        '200':
          description: 钱包信息
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/WalletInfo'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/wallets/{owner_type}/{owner_id}:
    get:
      tags:
        - wallet
      summary: 获取指定用户钱包信息
      operationId: getUserWallet
      security:
        - AdminSessionAuth: []
      parameters:
        - name: owner_type
          in: path
          required: true
          schema:
            type: string
            enum: [platform, carrier, customer]
        - name: owner_id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: 钱包信息
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/WalletInfo'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /api/wallets/{wallet_id}/transactions:
    get:
      tags:
        - wallet
      summary: 获取钱包交易记录
      operationId: getWalletTransactions
      security:
        - TenantSessionAuth: []
      parameters:
        - name: wallet_id
          in: path
          required: true
          schema:
            type: integer
        - name: page
          in: query
          required: false
          schema:
            type: integer
        - name: limit
          in: query
          required: false
          schema:
            type: integer
        - name: transaction_type
          in: query
          required: false
          schema:
            type: string
            enum: [income, expense, freeze, unfreeze, transfer]
        - name: start_date
          in: query
          required: false
          schema:
            type: string
            format: date-time
        - name: end_date
          in: query
          required: false
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: 交易记录列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      transactions:
                        type: array
                        items:
                          $ref: '#/components/schemas/WalletTransaction'
                      pagination:
                        $ref: '#/components/schemas/PaginationInfo'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  # 新增结算相关API
  /api/settlements/process/{order_id}:
    post:
      tags:
        - settlement
      summary: 处理订单结算
      operationId: processOrderSettlement
      security:
        - AdminSessionAuth: []
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                force_settle:
                  type: boolean
                  description: 是否强制结算
      responses:
        '200':
          description: 结算成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  data:
                    type: object
                    properties:
                      order_id:
                        type: integer
                      gross_amount:
                        type: number
                      commission_amount:
                        type: number
                      net_amount:
                        type: number
                      order_status:
                        type: string
                      wallets:
                        type: object
                        properties:
                          customer:
                            $ref: '#/components/schemas/WalletBalance'
                          carrier:
                            $ref: '#/components/schemas/WalletBalance'
                          platform:
                            $ref: '#/components/schemas/WalletBalance'
                      transactions:
                        type: object
                        properties:
                          commission:
                            $ref: '#/components/schemas/TransactionInfo'
                          platform_income:
                            $ref: '#/components/schemas/TransactionInfo'
                          payment:
                            $ref: '#/components/schemas/TransactionInfo'
                          carrier_income:
                            $ref: '#/components/schemas/TransactionInfo'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'
```

## 4. API实现

### 4.1 承运商车辆分配订单
```javascript
// backend/api/handlers/carrier/order/assignVehicleToOrder.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 承运商为订单分配车辆处理器启动 ---");
  const userId = c.context?.id;
  const order_id = c.request.params.order_id;
  const { vehicle_id } = c.request.body;

  // 验证权限和参数
  if (!userId || !order_id || !vehicle_id) {
    return { status: 400, body: { success: false, error: 'MISSING_PARAMETERS' } };
  }

  if (!c.context.roles.includes('carrier')) {
    return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
  }

  const db = getDb();

  try {
    // 檢查订单状态和车辆归属
    const order = await db.get(
      `SELECT id, status FROM orders WHERE id = ? AND status = 'pending_claim'`,
      [order_id]
    );
    
    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_PENDING_CLAIM' } };
    }

    const vehicle = await db.get(
      `SELECT v.*, t.id as tenant_id FROM tenant_vehicles v JOIN users u ON v.tenant_id = u.tenant_id WHERE v.id = ? AND u.id = ?`,
      [vehicle_id, userId]
    );
    
    if (!vehicle) {
      return { status: 403, body: { success: false, error: 'VEHICLE_NOT_OWNED_BY_CARRIER' } };
    }

    // 檢查车辆当前活跃订单数
    const activeOrdersCount = await db.get(
      `SELECT COUNT(*) as count FROM order_assignments WHERE vehicle_id = ? AND status IN ('assigned', 'quoted')`,
      [vehicle_id]
    );
    
    if (activeOrdersCount.count >= vehicle.max_active_orders) {
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'VEHICLE_MAX_ACTIVE_ORDERS_LIMIT_REACHED',
          message: `车辆当前正在处理 ${activeOrdersCount.count} 个订单，已达上限 ${vehicle.max_active_orders} 个`
        } 
      };
    }

    // 檢查是否已分配
    const existingAssignment = await db.get(
      `SELECT id FROM order_assignments WHERE order_id = ? AND vehicle_id = ?`,
      [order_id, vehicle_id]
    );
    
    if (existingAssignment) {
      return { 
        status: 409, 
        body: { 
          success: false, 
          error: 'ORDER_ALREADY_ASSIGNED_TO_VEHICLE',
          message: '订单已分配给该车辆'
        } 
      };
    }

    // 分配订单给车辆
    await db.run(
      `INSERT INTO order_assignments (order_id, carrier_id, vehicle_id, status) VALUES (?, ?, ?, 'assigned')`,
      [order_id, userId, vehicle_id]
    );

    // 增加车辆活跃订单计数
    await db.run(
      `UPDATE tenant_vehicles SET current_active_orders = current_active_orders + 1 WHERE id = ?`,
      [vehicle_id]
    );

    // 返回分配信息
    const assignment = await db.get(
      `SELECT * FROM order_assignments WHERE order_id = ? AND vehicle_id = ?`,
      [order_id, vehicle_id]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: '订单分配成功',
        data: { assignment }
      }
    };

  } catch (error) {
    console.error('Assign vehicle to order error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};
```

### 4.2 客户选择承运商（增强版，含支付锁定）
```javascript
// backend/api/handlers/customer/order/awardOrderToCarrierWithPayment.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  const { carrier_tenant_id, vehicle_id } = c.request.body;

  console.log(`[awardOrderToCarrierWithPayment] Awarding order ${order_id} to carrier tenant ${carrier_tenant_id} with vehicle ${vehicle_id}`);

  // 验证参数
  if (!order_id || !carrier_tenant_id || !vehicle_id) {
    console.log('[awardOrderToCarrierWithPayment] Missing required parameters');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Order ID, carrier tenant ID, and vehicle ID are required'
      }
    };
  }

  const db = getDb();

  try {
    // 1. 检查订单是否属于当前客户
    const order = await db.get(
      `SELECT id, tenant_id, status, customer_tenant_id FROM orders WHERE id = ?`,
      [order_id]
    );

    if (!order) {
      console.log(`[awardOrderToCarrierWithPayment] Order not found: ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }

    // 验证订单是否属于当前客户
    if (order.tenant_id !== c.context.tenantId) {
      console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} does not belong to current customer`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: 'This order does not belong to you'
        }
      };
    }

    // 验证订单当前状态是否允许被授予
    if (!['created', 'pending_claim', 'quoted'].includes(order.status)) {
      console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} is not in a state that allows awarding: ${order.status}`);
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATE',
          message: 'Order is not in a state that allows awarding to a carrier'
        }
      };
    }

    // 2. 获取承运商用户ID和车辆信息
    const carrierUser = await db.get(
      `SELECT id FROM users WHERE tenant_id = ? AND user_type = 'tenant_user'`,
      [carrier_tenant_id]
    );

    if (!carrierUser) {
      console.log(`[awardOrderToCarrierWithPayment] Carrier tenant not found: ${carrier_tenant_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'CARRIER_NOT_FOUND',
          message: 'Carrier tenant not found'
        }
      };
    }

    // 验证车辆是否属于该承运商
    const vehicle = await db.get(
      `SELECT id, tenant_id FROM tenant_vehicles WHERE id = ?`,
      [vehicle_id]
    );

    if (!vehicle) {
      console.log(`[awardOrderToCarrierWithPayment] Vehicle not found: ${vehicle_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      };
    }

    // 验证车辆是否属于该承运商
    const vehicleOwner = await db.get(
      `SELECT u.id FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE t.id = ? AND u.id = ?`,
      [vehicle.tenant_id, carrierUser.id]
    );

    if (!vehicleOwner) {
      console.log(`[awardOrderToCarrierWithPayment] Vehicle ${vehicle_id} does not belong to carrier ${carrier_tenant_id}`);
      return {
        status: 403,
        body: {
          success: false,
          error: 'VEHICLE_NOT_OWNED_BY_CARRIER',
          message: 'Vehicle does not belong to the selected carrier'
        }
      };
    }

    // 3. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 4. 更新订单状态为'awarded'，并设置承运商和车辆信息
    const updateOrderResult = await db.run(
      `UPDATE orders
       SET status = 'awarded', carrier_id = ?, vehicle_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [carrierUser.id, vehicle_id, order_id]
    );

    if (updateOrderResult.changes === 0) {
      console.log(`[awardOrderToCarrierWithPayment] Failed to update order ${order_id}`);
      await db.run('ROLLBACK');
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_UPDATE_FAILED',
          message: 'Failed to update order'
        }
      };
    }

    // 5. 更新其他分配记录为'rejected'状态
    await db.run(
      `UPDATE order_assignments 
       SET status = 'rejected', updated_at = datetime('now')
       WHERE order_id = ? AND (carrier_id != ? OR vehicle_id != ?)`,
      [order_id, carrierUser.id, vehicle_id]
    );

    // 6. 减少其他车辆的活跃订单计数
    await db.run(
      `UPDATE tenant_vehicles 
       SET current_active_orders = MAX(0, current_active_orders - 1), updated_at = datetime('now')
       WHERE id IN (
         SELECT vehicle_id FROM order_assignments 
         WHERE order_id = ? AND status = 'rejected'
       )`,
      [order_id]
    );

    // 7. 处理支付锁定（简化处理，实际应用中需要集成支付网关）
    console.log(`[awardOrderToCarrierWithPayment] Processing payment lock for order ${order_id}`);
    
    // 这里可以添加支付处理逻辑，如调用第三方支付API
    const paymentLockResult = {
      transaction_id: `PAY-${order_id}-${Date.now()}`,
      status: 'locked',
      amount: order.quote_price || 0, // 使用报价金额或订单金额
      currency: 'CNY'
    };

    // 8. 提交事务
    await db.run('COMMIT');

    console.log(`[awardOrderToCarrierWithPayment] Order ${order_id} successfully awarded to carrier ${carrierUser.id} with vehicle ${vehicle_id}`);

    return {
      status: 200,
      body: {
        success: true,
        message: 'Order successfully awarded to carrier with payment locked',
        data: {
          order_id: order_id,
          carrier_tenant_id: carrier_tenant_id,
          vehicle_id: vehicle_id,
          status: 'awarded',
          payment_lock: paymentLockResult
        }
      }
    };

  } catch (error) {
    console.error('[awardOrderToCarrierWithPayment] Database error:', error);
    await db.run('ROLLBACK');
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while processing your request'
      }
    };
  }
};
```

### 4.3 抽佣计算实现
```javascript
// backend/api/handlers/admin/commission/calculateCommission.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;

  console.log(`[calculateCommission] Calculating commission for order ${order_id}`);

  // 验证参数
  if (!order_id) {
    console.log('[calculateCommission] Missing required order_id parameter');
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_ORDER_ID',
        message: 'Order ID is required'
      }
    };
  }

  // 驗证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.log('[calculateCommission] Unauthorized: Admin role required');
    return { 
      status: 403, 
      body: { 
        success: false, 
        error: 'FORBIDDEN', 
        message: '需要管理员权限' 
      } 
    };
  }

  const db = getDb();

  try {
    // 1. 获取订单信息
    const order = await db.get(`
      SELECT 
        o.id,
        o.tracking_number,
        o.quote_price,
        o.total_price_with_addons,
        o.carrier_id,
        o.vehicle_id,
        o.customer_tenant_id,
        o.status as order_status,
        u.name as carrier_name,
        t.name as tenant_name
      FROM orders o
      LEFT JOIN users u ON o.carrier_id = u.id
      LEFT JOIN tenants t ON o.customer_tenant_id = t.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order) {
      console.log(`[calculateCommission] Order not found: ${order_id}`);
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }

    // 2. 获取车辆信息
    let vehicleInfo = null;
    if (order.vehicle_id) {
      vehicleInfo = await db.get(`
        SELECT 
          tv.id,
          tv.plate_number,
          tv.tenant_id as carrier_tenant_id,
          tv.current_active_orders,
          tv.max_active_orders,
          tv.penalty_points,
          tv.commission_increase_percent,
          tv.commission_increase_expiry,
          tv.status as vehicle_status
        FROM tenant_vehicles tv
        WHERE tv.id = ?
      `, [order.vehicle_id]);
    }

    // 3. 获取基础抽佣规则
    const baseRule = await db.get(`
      SELECT 
        id as rule_id,
        rule_name,
        base_commission_percent,
        min_commission_percent,
        max_commission_percent
      FROM commission_rules 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `) || {
      rule_id: null,
      rule_name: '默认规则',
      base_commission_percent: 10.0,
      min_commission_percent: 0.0,
      max_commission_percent: 50.0
    };

    // 4. 获取车辆特定的抽佣覆盖规则
    let vehicleOverride = null;
    if (vehicleInfo) {
      vehicleOverride = await db.get(`
        SELECT 
          id as override_id,
          override_type,
          override_value,
          reason,
          effective_from,
          effective_until
        FROM vehicle_commission_overrides
        WHERE vehicle_id = ? 
          AND is_active = 1
          AND datetime('now') BETWEEN effective_from AND COALESCE(effective_until, datetime('now', '+1 year'))
        ORDER BY created_at DESC
        LIMIT 1
      `, [order.vehicle_id]);
    }

    // 5. 计算最终抽佣比例
    let baseCommission = baseRule.base_commission_percent;
    let overrideCommission = null;
    let penaltyCommission = 0;
    let finalCommission = baseCommission;

    // 检查是否有车辆特定的覆盖规则
    if (vehicleOverride) {
      if (vehicleOverride.override_type === 'percentage') {
        overrideCommission = vehicleOverride.override_value;
        finalCommission = overrideCommission;
      } else if (vehicleOverride.override_type === 'fixed') {
        // 固定金额类型的覆盖需要根据订单金额计算百分比
        const orderAmount = order.total_price_with_addons || order.quote_price || 0;
        overrideCommission = orderAmount > 0 ? (vehicleOverride.override_value / orderAmount) * 100 : 0;
        finalCommission = overrideCommission;
      }
    }

    // 检查是否有因违规导致的抽佣增加
    if (vehicleInfo && vehicleInfo.commission_increase_percent) {
      const isPenaltyExpired = vehicleInfo.commission_increase_expiry && 
        new Date() > new Date(vehicleInfo.commission_increase_expiry);
      
      if (!isPenaltyExpired) {
        penaltyCommission = vehicleInfo.commission_increase_percent;
        // 如果没有覆盖规则，则在基础抽佣上增加
        if (overrideCommission === null) {
          finalCommission += penaltyCommission;
        }
      }
    }

    // 应用最小/最大限制
    finalCommission = Math.max(finalCommission, baseRule.min_commission_percent);
    finalCommission = Math.min(finalCommission, baseRule.max_commission_percent);

    // 6. 计算抽佣金额
    const orderAmount = order.total_price_with_addons || order.quote_price || 0;
    const commissionAmount = (orderAmount * finalCommission / 100);

    // 7. 记录抽佣历史
    await db.run(`
      INSERT INTO commission_history (
        order_id, vehicle_id, base_commission_percent, 
        override_commission_percent, final_commission_percent, 
        calculated_amount, applied_rule_id, adjustment_reason, 
        processed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      order.id,
      order.vehicle_id,
      baseCommission,
      overrideCommission,
      finalCommission,
      commissionAmount,
      baseRule.rule_id,
      \`计算抽佣: 基础\${baseCommission}%, 覆盖\${overrideCommission||0}%, 违规增加\${penaltyCommission}%\`,
      c.context.id
    ]);

    // 8. 准备返回数据
    const commissionCalculation = {
      order: {
        id: order.id,
        tracking_number: order.tracking_number,
        amount: orderAmount,
        carrier_name: order.carrier_name,
        tenant_name: order.tenant_name,
        status: order.order_status
      },
      vehicle: vehicleInfo ? {
        id: vehicleInfo.id,
        plate_number: vehicleInfo.plate_number,
        status: vehicleInfo.vehicle_status,
        penalty_points: vehicleInfo.penalty_points
      } : null,
      rules: {
        base_rule: baseRule,
        vehicle_override: vehicleOverride
      },
      calculation_breakdown: {
        base_commission_percent: baseCommission,
        override_commission_percent: overrideCommission,
        penalty_commission_percent: penaltyCommission,
        final_commission_percent: finalCommission,
        commission_amount: commissionAmount
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[calculateCommission] Commission calculated for order ${order_id}: ${finalCommission}% = ${commissionAmount}`);

    return {
      status: 200,
      body: {
        success: true,
        message: 'Commission calculated successfully',
        data: commissionCalculation
      }
    };

  } catch (error) {
    console.error('[calculateCommission] Database error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while calculating commission'
      }
    };
  }
};
```

### 4.4 钱包结算实现
```javascript
// backend/api/handlers/settlement/processSettlement.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  const { force_settle } = c.request.body;

  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    return { status: 403, body: { success: false, error: 'FORBIDDEN' } };
  }

  const db = getDb();

  try {
    // 1. 获取订单信息
    const order = await db.get(`
      SELECT 
        o.id, o.quote_price, o.total_price_with_addons, o.carrier_id, o.customer_tenant_id,
        o.status as order_status,
        u.name as carrier_name, cu.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.carrier_id = u.id
      LEFT JOIN tenants cu ON o.customer_tenant_id = cu.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
    }

    // 检查订单状态是否允许结算
    if (!['awarded', 'dispatched', 'in_transit', 'delivered'].includes(order.order_status)) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'INVALID_ORDER_STATUS_FOR_SETTLEMENT',
          message: '订单状态不允许结算'
        } 
      };
    }

    // 2. 计算抽佣金额
    const commissionCalculation = await db.get(`
      SELECT final_commission_percent, commission_amount
      FROM commission_history
      WHERE order_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [order_id]);

    if (!commissionCalculation) {
      return { status: 404, body: { success: false, error: 'COMMISSION_CALCULATION_NOT_FOUND' } };
    }

    // 3. 获取相关钱包
    // 确保钱包存在，如果不存在则创建
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('platform', 1, 0.0, 0.0, 'active')
    `);
    
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('carrier', ?, 0.0, 0.0, 'active')
    `, [order.carrier_id]);
    
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('customer', ?, 0.0, 0.0, 'active')
    `, [order.customer_tenant_id]);

    const platformWallet = await db.get(
      `SELECT id, balance, available_balance FROM wallets WHERE owner_type = 'platform' AND owner_id = 1`
    );
    
    const carrierWallet = await db.get(
      `SELECT id, balance, available_balance FROM wallets WHERE owner_type = 'carrier' AND owner_id = ?`,
      [order.carrier_id]
    );
    
    const customerWallet = await db.get(
      `SELECT id, balance, available_balance FROM wallets WHERE owner_type = 'customer' AND owner_id = ?`,
      [order.customer_tenant_id]
    );

    if (!platformWallet || !carrierWallet || !customerWallet) {
      return { status: 404, body: { success: false, error: 'WALLETS_NOT_FOUND' } };
    }

    // 4. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 5. 计算金额
    const grossAmount = order.total_price_with_addons || order.quote_price || 0;
    const commissionAmount = commissionCalculation.commission_amount;
    const netAmount = grossAmount - commissionAmount;

    // 检查客户钱包余额是否足够
    if (customerWallet.available_balance < grossAmount) {
      await db.run('ROLLBACK');
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'INSUFFICIENT_FUNDS',
          message: '客户钱包余额不足'
        } 
      };
    }

    // 6. 执行抽佣交易（客户 -> 平台）
    const commissionTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'expense', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      customerWallet.id, order_id, commissionAmount, -commissionAmount,
      `订单 ${order_id} 抽佣`, `COMMISSION-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
      [commissionAmount, customerWallet.id]
    );

    const platformTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'income', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      platformWallet.id, order_id, commissionAmount, commissionAmount,
      `订单 ${order_id} 抽佣收入`, `COMMISSION-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
      [commissionAmount, platformWallet.id]
    );

    // 7. 执行支付交易（客户 -> 承运商）
    const paymentTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'expense', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      customerWallet.id, order_id, netAmount, -netAmount,
      `订单 ${order_id} 支付给承运商`, `PAYMENT-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
      [netAmount, customerWallet.id]
    );

    const carrierTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'income', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      carrierWallet.id, order_id, netAmount, netAmount,
      `订单 ${order_id} 收入`, `PAYMENT-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
      [netAmount, carrierWallet.id]
    );

    // 8. 记录结算详情
    await db.run(`
      INSERT INTO settlements (
        order_id, carrier_wallet_id, platform_wallet_id, 
        gross_amount, commission_amount, net_amount, 
        settlement_status, commission_transaction_id, payment_transaction_id,
        created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))
    `, [
      order_id, carrierWallet.id, platformWallet.id,
      grossAmount, commissionAmount, netAmount,
      commissionTx.lastID, carrierTx.lastID
    ]);

    // 9. 更新订单状态为已结算
    await db.run(
      `UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?`,
      [order_id]
    );

    await db.run('COMMIT');

    return {
      status: 200,
      body: {
        success: true,
        message: 'Settlement completed successfully',
        data: {
          order_id,
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          order_status: 'completed',
          wallets: {
            customer: { id: customerWallet.id, balance: customerWallet.balance - grossAmount },
            carrier: { id: carrierWallet.id, balance: carrierWallet.balance + netAmount },
            platform: { id: platformWallet.id, balance: platformWallet.balance + commissionAmount }
          },
          transactions: {
            commission: { id: commissionTx.lastID, wallet_id: customerWallet.id, amount: -commissionAmount },
            platform_income: { id: platformTx.lastID, wallet_id: platformWallet.id, amount: commissionAmount },
            payment: { id: paymentTx.lastID, wallet_id: customerWallet.id, amount: -netAmount },
            carrier_income: { id: carrierTx.lastID, wallet_id: carrierWallet.id, amount: netAmount }
          }
        }
      }
    };

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Settlement error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};
```

## 5. 业务流程

### 5.1 订单竞价流程
1. 客户发布订单 → status: 'pending_claim'
2. 总后台处理订单 → 订单状态更新为'pending_claim'，开放给承运商
3. 承运商认领订单 → 承运商选择车辆并分配订单，在order_assignments表创建记录
4. 承运商提交报价 → 报价存储在quotes表
5. 客户选择承运商/车辆 → 客户从所有报价中选择最优承运商
6. 支付锁定 → 客户支付费用，订单状态更新为'awarded'
7. 承运商同一车的其余报价失效 → 系统自动处理其他分配记录为'rejected'，减少车辆活跃订单计数

### 5.2 多车竞价处理
- 同一承运商的多辆车可同时分配给同一订单
- 客户选择后，系统自动处理其他分配记录，同一车辆的其余订单报价失效

### 5.3 违规处理流程
- 发生违规 → 创建违规记录 → 管理员审核 → 执行处罚

### 5.4 抽佣计算与钱包结算流程
1. 订单结算时 → 获取车辆信息 → 查询抽佣规则 → 计算最终抽佣比例
2. 执行钱包交易 → 从客户钱包扣除抽佣金额 → 计入平台钱包
3. 执行钱包交易 → 从客户钱包扣除净额 → 计入承运商钱包
4. 记录结算历史 → 更新订单状态为'delivered'或'completed'
5. 生成财务报表 → 统计抽佣收入、承运商收入等

### 5.5 钱包模块流程
- **钱包创建**：为平台、承运商、客户创建钱包账户
- **资金冻结**：客户下单时冻结相应金额
- **抽佣划转**：订单完成后从客户钱包划转抽佣到平台钱包
- **支付划转**：订单完成后从客户钱包划转净额到承运商钱包
- **交易记录**：记录所有资金流动详情
- **余额管理**：实时更新各钱包余额
- **结算处理**：订单完成后自动执行资金划转
- **财务对账**：生成财务报表，统计收入支出

## 6. 部署说明

### 6.1 数据库迁移
1. 执行数据库结构更新脚本
2. 验证新表结构

### 6.2 API部署
1. 部署新的API处理器
2. 验证API接口

### 6.3 前端更新
1. 更新车辆选择界面
2. 更新订单管理界面

### 6.4 配置管理
1. 设置默认参数
2. 配置抽佣规则

## 7. 测试计划

### 7.1 功能测试
- 车辆分配订单功能
- 多车竞价处理
- 违规处罚机制
- 抽佣计算

### 7.2 集成测试
- 端到端订单流程
- 多承运商竞价场景
- 违规处理流程

### 7.3 性能测试
- 高并发订单处理
- 多车竞价性能

此文档遵循OpenAPI同步规则，所有API接口和数据模型与openapi.yaml保持严格一致。