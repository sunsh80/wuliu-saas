# 数孪智运无人物流 SaaS 平台 - 开发规划文档

**项目名称**: 数孪智运无人物流 SaaS 平台  
**文档版本**: 1.0  
**生成时间**: 2026-02-21  
**文档类型**: 功能开发规划总览

---

## 📋 文档概述

本文档记录数孪智运无人物流 SaaS 平台的完整功能开发规划，基于现有 1.0.x 版本功能，参考**网约车**（滴滴/Uber）和**无人物流平台**行业最佳实践，规划后续版本开发内容。

---

## 🗺️ 版本路线图

```
1.0.x (现有) ──→ 1.0.1 (功能深化) ──→ 1.1.0 (新增模块) ──→ 2.0.0 (平台成熟)
   │                │                     │
   │                │                     │
 基础功能          业务扩展              平台能力
 ·订单             ·一单多点             ·智能调度
 ·租户             ·混合支付             ·安全风控
 ·车辆             ·优惠券               ·充电桩
 ·地图             ·客服系统             ·电子围栏
 ·钱包             ·评价信用             ·维保管理
 ·结算             ·数据统计             ·积分商城
```

---

## 📊 版本对比总览

| 版本 | 定位 | 模块数 | 新增表 | 新增 API | 工作量 | 周期 |
|------|------|--------|--------|----------|--------|------|
| **1.0.x** | 基础功能 | 8 | - | ~40 | - | - |
| **1.0.1** | 功能深化 | 7 | ~18 | ~50 | 34 人天 | 6 周 |
| **1.1.0** | 新增模块 | 6 | ~25 | ~70 | 30 人天 | 7 周 |
| **合计** | - | 13 | ~43 | ~120 | 64 人天 | 13 周 |

---

# 第一部分：1.0.1 版本功能扩展

## 📋 版本概述

1.0.1 版本在 1.0.x 现有功能基础上，对已有模块进行深化扩展，完善核心业务流程。

### 现有功能基础（1.0.x）

| 模块 | 已有功能 |
|------|----------|
| 订单管理 | 创建订单、订单列表、订单详情、更新状态、分配承运商、报价管理 |
| 租户管理 | 租户申请、审核、车辆管理、服务区域管理 |
| 车辆管理 | 车辆 CRUD、车型库、车辆追踪 |
| 地图服务 | 地理编码、路径规划、距离计算、POI 搜索、停靠点管理 |
| 无人车路径 | 路径规划、多点路径、路径调整 |
| 钱包管理 | 余额查询、充值、交易记录 |
| 结算管理 | 订单结算处理 |
| 佣金管理 | 佣金配置、佣金记录 |
| 违规管理 | 违规记录管理 |
| 系统配置 | 系统配置、服务提供商配置 |

---

## 一、订单模块扩展

### 1.1 一单多点卸货 🔥

**扩展现有**: `orders` 表、`/api/av-route/multi-point`

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 多点下单 | 创建订单时添加多个卸货点 | P0 |
| 📱 小程序 | 卸货点管理 | 编辑、删除、调整卸货点顺序 | P0 |
| 📱 小程序 | 多点订单详情 | 展示所有卸货点及状态 | P0 |
| 📱 小程序 | 多点轨迹追踪 | 实时显示已完成/待完成卸货点 | P0 |
| 🖥️ PC 平台 | 多点订单监控 | 监控所有多点订单状态 | P0 |
| 🖥️ PC 平台 | 路径优化干预 | 人工重新规划卸货顺序 | P1 |
| 🖥️ PC 平台 | 多点定价配置 | 配置多点订单计价规则 | P0 |
| 🚚 PC 承运商 | 多点接单 | 抢单/接单（多点订单） | P0 |
| 🚚 PC 承运商 | 逐点导航 | 按顺序导航至各卸货点 | P0 |
| 🚚 PC 承运商 | 逐点签收 | 每个卸货点拍照/签收确认 | P0 |

#### 数据库设计

```sql
-- 多点订单扩展表
CREATE TABLE multipoint_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE,          -- 关联 orders.id
    total_distance REAL,
    total_duration REAL,
    total_amount REAL,
    segment_amounts TEXT,             -- JSON 数组，每段费用
    current_point_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    created_at DATETIME,
    completed_at DATETIME
);

-- 卸货点表
CREATE TABLE delivery_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    point_index INTEGER,              -- 卸货点顺序
    address TEXT,
    latitude REAL,
    longitude REAL,
    contact_name TEXT,
    contact_phone TEXT,
    goods_description TEXT,
    goods_weight REAL,
    status TEXT DEFAULT 'pending',    -- pending/completed/failed
    signed_by TEXT,
    signed_at DATETIME,
    signature_image TEXT,
    created_at DATETIME
);
```

#### 新增 API

```
POST   /api/customer/order/create-multipoint    # 创建多点订单
GET    /api/customer/order/multipoint/:id       # 多点订单详情
PUT    /api/customer/order/multipoint/:id       # 更新多点订单
POST   /api/customer/order/delivery-point       # 添加卸货点
DELETE /api/customer/order/delivery-point/:id   # 删除卸货点
PUT    /api/customer/order/reorder-points       # 调整顺序

GET    /api/admin/order/multipoint-list         # 多点订单列表
POST   /api/admin/order/optimize-route          # 路径优化

POST   /api/carrier/order/claim-multipoint      # 抢多点订单
POST   /api/carrier/order/checkin-point         # 卸货点签收
POST   /api/carrier/order/point-exception       # 上报异常
```

---

### 1.2 订单全生命周期追踪

**扩展现有**: `orders.status`

#### 订单状态扩展

```
pending        → 待接单
assigned       → 已分配/已接单
pickup_done    → 已取货
in_delivery    → 配送中
at_delivery_point → 到达卸货点
delivered      → 已送达
completed      → 已完成
cancelled      → 已取消
refunded       → 已退款
```

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 订单状态追踪 | 实时查看订单当前状态 | P0 |
| 📱 小程序 | 状态变更通知 | 订单状态变更推送提醒 | P1 |
| 🖥️ PC 平台 | 订单状态监控 | 查看所有订单状态分布 | P0 |
| 🖥️ PC 平台 | 异常订单预警 | 超时未接单、长时间未配送预警 | P0 |
| 🚚 PC 承运商 | 状态上报 | 更新订单执行状态 | P0 |

---

### 1.3 智能匹配/派单

**扩展现有**: `matching` 标签、`/api/carrier/order/claim`

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 🖥️ PC 平台 | 派单模式配置 | 抢单/派单/混合模式切换 | P0 |
| 🖥️ PC 平台 | 匹配规则配置 | 配置匹配权重（距离、评分、服务区域） | P0 |
| 🖥️ PC 平台 | 派单记录查询 | 查看派单历史、成功率 | P1 |
| 🚚 PC 承运商 | 自动接单设置 | 设置自动接单条件（区域、货物类型） | P1 |
| 🚚 PC 承运商 | 派单偏好 | 设置偏好订单类型、区域 | P1 |

#### 数据库设计

```sql
-- 派单记录表
CREATE TABLE dispatch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    carrier_id INTEGER,
    match_score REAL,               -- 匹配分数
    dispatch_mode TEXT,             -- auto/manual/grab
    status TEXT,                    -- pending/accepted/rejected/timeout
    created_at DATETIME
);

-- 承运商偏好表
CREATE TABLE carrier_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrier_id INTEGER UNIQUE,
    preferred_areas TEXT,           -- JSON 偏好区域
    preferred_cargo_types TEXT,     -- JSON 偏好货物类型
    auto_accept_enabled INTEGER DEFAULT 0,
    auto_accept_radius_km REAL DEFAULT 10,
    min_order_amount REAL
);
```

---

### 1.4 动态定价

**扩展现有**: `pricing_rules` 表

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 实时价格展示 | 下单前显示预估价格 | P0 |
| 📱 小程序 | 价格说明 | 显示价格构成明细 | P0 |
| 📱 小程序 | 高峰期提示 | 高峰期溢价提示 | P1 |
| 🖥️ PC 平台 | 定价规则管理 | 基础定价配置（起步价、里程价、时长价） | P0 |
| 🖥️ PC 平台 | 动态因子配置 | 天气、时段、供需比调价因子 | P0 |
| 🖥️ PC 平台 | 区域定价 | 核心区、偏远区差异化定价 | P0 |
| 🖥️ PC 平台 | 价格监控 | 实时监控价格水平、异常价格预警 | P1 |
| 🚚 PC 承运商 | 价格倍率查看 | 查看当前价格倍率、高峰奖励 | P1 |

#### 数据库设计

```sql
-- 动态调价因子表
CREATE TABLE pricing_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factor_type TEXT,               -- weather/holiday/rush_hour/supply_demand
    factor_name TEXT,
    factor_value REAL,              -- 调价倍率 1.2x
    condition TEXT,                 -- JSON 触发条件
    start_time DATETIME,
    end_time DATETIME,
    is_active INTEGER DEFAULT 1
);

-- 价格快照表
CREATE TABLE price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    base_price REAL,
    factor_adjustments TEXT,        -- JSON 各因子调整
    final_price REAL,
    snapshot_at DATETIME
);
```

---

## 二、支付模块扩展

### 2.1 混合支付 🔥

**扩展现有**: `wallet` 表、`/api/wallet/recharge`

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 支付方式选择 | 现金、优惠券、混合支付选择 | P0 |
| 📱 小程序 | 混合支付配置 | 设置现金支付比例、用券张数 | P0 |
| 📱 小程序 | 支付确认页 | 显示各支付方式金额明细 | P0 |
| 📱 小程序 | 退款申请 | 申请退款、选择退款方式 | P0 |
| 📱 小程序 | 退款进度 | 查看退款进度、历史记录 | P0 |
| 🖥️ PC 平台 | 支付配置 | 混合支付规则、现金比例限制 | P0 |
| 🖥️ PC 平台 | 退款审核 | 退款申请审核、驳回 | P0 |
| 🖥️ PC 平台 | 退款处理 | 执行退款、原路返回配置 | P0 |
| 🖥️ PC 平台 | 支付对账 | 日/周/月对账报表 | P0 |
| 🖥️ PC 平台 | 资金流水 | 完整资金流水记录 | P0 |
| 🚚 PC 承运商 | 收款管理 | 承运商收款记录查询 | P0 |
| 🚚 PC 承运商 | 结算对账 | 与平台结算对账 | P0 |

#### 数据库设计

```sql
-- 支付配置表
CREATE TABLE payment_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE,
    config_value TEXT,              -- JSON
    description TEXT,
    updated_at DATETIME
);

-- 支付记录表
CREATE TABLE payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER,
    total_amount REAL,
    cash_amount REAL,               -- 现金支付金额
    coupon_amount REAL,             -- 优惠券抵扣金额
    balance_amount REAL,            -- 余额支付金额
    payment_method TEXT,            -- mixed/cash/coupon/balance
    payment_status TEXT DEFAULT 'pending',
    used_coupons TEXT,              -- JSON 数组 [{coupon_id, amount}]
    payment_order TEXT,             -- 支付顺序 coupon_first/cash_first
    paid_at DATETIME,
    created_at DATETIME
);

-- 退款记录表
CREATE TABLE refund_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    payment_id INTEGER,
    user_id INTEGER,
    refund_amount REAL,
    refund_cash_amount REAL,        -- 退还现金
    refund_coupon_amount REAL,      -- 退还优惠券
    refund_reason TEXT,
    refund_type TEXT,               -- full/partial
    status TEXT DEFAULT 'pending',
    audit_by INTEGER,
    audit_at DATETIME,
    processed_at DATETIME,
    refund_method TEXT,             -- original_path/balance
    created_at DATETIME
);
```

#### 新增 API

```
POST   /api/customer/payment/mixed-pay          # 发起混合支付
GET    /api/customer/payment/calculate          # 计算支付明细
POST   /api/customer/payment/refund             # 申请退款
GET    /api/customer/payment/refund-status      # 退款进度

GET    /api/admin/payment/config                # 支付配置
PUT    /api/admin/payment/config                # 更新支付配置
GET    /api/admin/payment/refunds               # 退款申请列表
POST   /api/admin/payment/refund-approve        # 审核通过退款
POST   /api/admin/payment/refund-reject         # 驳回退款
POST   /api/admin/payment/process-refund        # 执行退款
GET    /api/admin/payment/reconciliation        # 对账报表
GET    /api/admin/payment/transactions          # 资金流水
```

---

## 三、营销模块扩展

### 3.1 优惠券系统 🔥

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 优惠券中心 | 领取优惠券、查看可用券 | P0 |
| 📱 小程序 | 我的优惠券 | 已领取优惠券（未使用/已使用/过期） | P0 |
| 📱 小程序 | 充值活动 | 充值赠券活动展示 | P0 |
| 📱 小程序 | 邀请有礼 | 邀请好友得优惠券 | P1 |
| 🖥️ PC 平台 | 优惠券管理 | 创建/编辑/下架优惠券 | P0 |
| 🖥️ PC 平台 | 券模板管理 | 优惠券模板配置（满减、折扣、无门槛） | P0 |
| 🖥️ PC 平台 | 活动管理 | 营销活动创建、排期 | P0 |
| 🖥️ PC 平台 | 充值配置 | 充值赠券规则配置 | P0 |
| 🖥️ PC 平台 | 发放记录 | 优惠券发放记录、核销统计 | P1 |
| 🖥️ PC 平台 | 效果分析 | 活动 ROI、转化率分析 | P1 |

#### 数据库设计

```sql
-- 优惠券模板表
CREATE TABLE coupon_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,                        -- discount/cash/no_threshold
    value REAL,                       -- 优惠金额/折扣率
    min_order_amount REAL,            -- 最低订单金额
    max_discount REAL,                -- 最大优惠（折扣型）
    valid_type TEXT,                  -- fixed/days
    valid_start DATETIME,
    valid_end DATETIME,
    valid_days INTEGER,
    total_quantity INTEGER,
    issued_quantity INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    applicable_scope TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME
);

-- 用户优惠券表
CREATE TABLE user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    template_id INTEGER,
    coupon_code TEXT UNIQUE,
    status TEXT DEFAULT 'unused',
    obtained_at DATETIME,
    used_at DATETIME,
    expired_at DATETIME,
    order_id INTEGER
);

-- 充值活动配置表
CREATE TABLE recharge_promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recharge_amount REAL,
    bonus_amount REAL,
    bonus_coupon_template_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    is_enabled INTEGER DEFAULT 1
);

-- 邀请关系表
CREATE TABLE invite_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id INTEGER,
    invitee_id INTEGER,
    invite_code TEXT,
    reward_status TEXT DEFAULT 'pending',
    reward_amount REAL,
    created_at DATETIME
);
```

---

## 四、客服模块扩展

### 4.1 在线客服与工单系统 🔥

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 在线客服 | 即时聊天界面，支持文字、图片 | P0 |
| 📱 小程序 | 客服列表 | 显示可用客服、工作时间 | P0 |
| 📱 小程序 | 投诉建议 | 提交投诉表单，上传凭证 | P0 |
| 📱 小程序 | 工单查询 | 查看工单状态、历史记录 | P0 |
| 📱 小程序 | 常见问题 | FAQ 知识库，支持搜索 | P1 |
| 🖥️ PC 平台 | 客服工作台 | 接待客户、分配会话 | P0 |
| 🖥️ PC 平台 | 会话管理 | 会话列表、转接、结束 | P0 |
| 🖥️ PC 平台 | 工单管理 | 工单处理、流转、回复 | P0 |
| 🖥️ PC 平台 | 服务质量 | 满意度统计、响应时长 | P1 |
| 🖥️ PC 平台 | 知识库管理 | FAQ 维护、分类管理 | P1 |
| 🖥️ PC 平台 | 投诉处理 | 投诉处理流程、升级机制 | P0 |
| 🚚 PC 承运商 | 客服接入 | 承运商客服接入客户 | P1 |
| 🚚 PC 承运商 | 异常上报 | 配送异常上报给平台 | P0 |

#### 数据库设计

```sql
-- 客服会话表
CREATE TABLE customer_service_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_no TEXT UNIQUE,
    customer_id INTEGER,
    agent_id INTEGER,
    status TEXT DEFAULT 'pending',
    source TEXT,                      -- chat/phone/complaint
    created_at DATETIME,
    closed_at DATETIME,
    rating INTEGER,
    rating_comment TEXT
);

-- 聊天消息表
CREATE TABLE service_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    sender_id INTEGER,
    sender_type TEXT,                 -- customer/agent/system
    message_type TEXT,                -- text/image/file
    content TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME
);

-- 工单表
CREATE TABLE service_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_no TEXT UNIQUE,
    customer_id INTEGER,
    type TEXT,                        -- complaint/suggestion/consult
    title TEXT,
    content TEXT,
    images TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    assigned_to INTEGER,
    created_at DATETIME,
    resolved_at DATETIME
);

-- FAQ 知识库表
CREATE TABLE service_knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    question TEXT,
    answer TEXT,
    keywords TEXT,
    view_count INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);
```

---

## 五、评价信用扩展

### 5.1 双向评价与信用分 🔥

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 订单评价 | 完成订单后评价承运商 | P0 |
| 📱 小程序 | 服务标签 | 选择服务标签（准时、态度好等） | P0 |
| 📱 小程序 | 信用分查看 | 查看个人信用分 | P1 |
| 🖥️ PC 平台 | 评价管理 | 查看所有评价、处理差评申诉 | P0 |
| 🖥️ PC 平台 | 信用分计算 | 自动计算用户/承运商信用分 | P0 |
| 🖥️ PC 平台 | 评分统计 | 承运商评分排名、统计 | P1 |
| 🖥️ PC 平台 | 信用规则配置 | 配置信用分计算规则 | P0 |
| 🚚 PC 承运商 | 服务分查看 | 查看服务分、乘客评价 | P0 |
| 🚚 PC 承运商 | 信用提升 | 查看信用提升任务 | P1 |
| 🚚 PC 承运商 | 申诉处理 | 差评申诉 | P1 |

#### 数据库设计

```sql
-- 订单评价表
CREATE TABLE order_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    reviewer_id INTEGER,
    reviewee_id INTEGER,
    reviewer_type TEXT,
    rating INTEGER,
    tags TEXT,
    comment TEXT,
    is_anonymous INTEGER DEFAULT 0,
    reply TEXT,
    created_at DATETIME
);

-- 用户信用分表
CREATE TABLE user_credit_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_type TEXT,
    credit_score INTEGER DEFAULT 100,
    completion_rate REAL,
    avg_rating REAL,
    violation_count INTEGER,
    last_updated DATETIME
);
```

---

## 六、数据统计扩展

### 6.1 运营数据与财务报表 🔥

**扩展现有**: `/api/admin/reports/overview-stats`

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 个人订单统计 | 查看个人订单数量、消费分析 | P1 |
| 📱 小程序 | 月度账单 | 月度消费汇总 | P1 |
| 🖥️ PC 平台 | 运营数据大屏 | 实时订单、收入、运力展示 | P0 |
| 🖥️ PC 平台 | 订单分析 | 订单趋势、完成率、取消率 | P0 |
| 🖥️ PC 平台 | 收入分析 | 收入趋势、客单价、ARPU | P0 |
| 🖥️ PC 平台 | 运力分析 | 活跃车辆、在线时长、接单率 | P0 |
| 🖥️ PC 平台 | 用户分析 | 新增用户、留存率、活跃用户 | P0 |
| 🖥️ PC 平台 | 转化漏斗 | 下单转化率、支付转化率 | P1 |
| 🖥️ PC 平台 | 财务报表 | 对账报表、流水导出 | P0 |
| 🚚 PC 承运商 | 收入统计 | 收入趋势、订单收入明细 | P0 |
| 🚚 PC 承运商 | 服务分趋势 | 服务分变化趋势 | P1 |
| 🚚 PC 承运商 | 在线时长 | 在线时长统计 | P1 |

#### 数据库设计

```sql
-- 运营统计表
CREATE TABLE daily_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE,
    total_orders INTEGER,
    completed_orders INTEGER,
    cancelled_orders INTEGER,
    total_revenue REAL,
    active_users INTEGER,
    active_vehicles INTEGER,
    avg_delivery_time REAL,
    created_at DATETIME
);

-- 用户行为统计表
CREATE TABLE user_behavior_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    stat_date DATE,
    order_count INTEGER,
    total_amount REAL,
    cancel_count INTEGER,
    created_at DATETIME
);
```

---

## 七、车辆/运力扩展

### 7.1 车辆状态与实时追踪

**扩展现有**: `vehicle_tracking` 表、`/api/vehicle-tracking/*`

#### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 实时车辆位置 | 地图上显示附近车辆 | P0 |
| 📱 小程序 | 配送轨迹回放 | 查看历史配送轨迹 | P1 |
| 📱 小程序 | 预计到达时间 | ETA 计算与展示 | P0 |
| 🖥️ PC 平台 | 车辆实时监控 | 地图上显示所有车辆位置 | P0 |
| 🖥️ PC 平台 | 轨迹回放 | 查询车辆历史轨迹 | P0 |
| 🖥️ PC 平台 | 车辆状态管理 | 空闲/服务中/充电中/维修中 | P0 |
| 🖥️ PC 平台 | 运力热力图 | 供需热力图可视化 | P1 |
| 🚚 PC 承运商 | 位置上报 | 定时上报车辆位置 | P0 |
| 🚚 PC 承运商 | 状态上报 | 更新车辆状态 | P0 |

#### 数据库设计

```sql
-- 车辆状态表
CREATE TABLE vehicle_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER UNIQUE,
    status TEXT,                    -- idle/serving/charging/maintenance/offline
    battery_level REAL,
    current_lat REAL,
    current_lng REAL,
    last_update DATETIME
);

-- 车辆位置历史表
CREATE TABLE vehicle_positions_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    latitude REAL,
    longitude REAL,
    speed REAL,
    direction REAL,
    accuracy REAL,
    timestamp DATETIME
);
```

---

## 1.0.1 开发排期

| 阶段 | 周期 | 模块 | 工作量 |
|------|------|------|--------|
| 第一阶段 | 2 周 | 订单扩展（一单多点）、支付扩展（混合支付）、车辆扩展 | 12 人天 |
| 第二阶段 | 2 周 | 营销模块（优惠券）、客服模块、评价信用 | 12 人天 |
| 第三阶段 | 2 周 | 数据统计、智能匹配、动态定价、优化迭代 | 10 人天 |
| **总计** | **6 周** | - | **34 人天** |

---

# 第二部分：1.1.0 版本新增模块

## 📋 版本概述

1.1.0 版本在 1.0.1 基础上，**新增独立功能模块**，参考滴滴/Uber 网约车平台和无人物流平台的行业最佳实践。

---

## 一、智能调度中心 🔥🔥🔥

**参考对象**: 滴滴派单系统、Uber 匹配引擎

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 附近车辆查看 | 地图上显示附近可用车辆 | P0 |
| 📱 小程序 | 预计接驾时间 | 显示司机预计到达取货点时间 | P0 |
| 📱 小程序 | 智能推荐上车点 | 推荐最佳取货/卸货位置 | P1 |
| 🖥️ PC 平台 | 智能派单配置 | 配置派单模式（抢单/派单/混合） | P0 |
| 🖥️ PC 平台 | 匹配规则配置 | 配置匹配权重 | P0 |
| 🖥️ PC 平台 | 运力热力图 | 实时展示运力分布和供需情况 | P0 |
| 🖥️ PC 平台 | 派单监控 | 实时监控派单成功率、响应时间 | P0 |
| 🖥️ PC 平台 | 顺路单计算 | 计算司机返程顺路订单 | P1 |
| 🚚 PC 承运商 | 自动接单 | 设置条件自动接单 | P1 |
| 🚚 PC 承运商 | 派单偏好 | 设置偏好订单类型和区域 | P1 |
| 🚚 PC 承运商 | 顺路单推荐 | 推送返程顺路订单 | P1 |

### 核心算法

**1. GeoHash 位置编码**
```
精度 6 位 ≈ 150 米 × 150 米
精度 7 位 ≈ 38 米 × 38 米
精度 8 位 ≈ 19 米 × 19 米
```

**2. 多维度匹配评分**
```javascript
matchScore = 
  distanceScore * 0.4 +      // 距离分
  ratingScore * 0.2 +        // 评分分
  serviceAreaScore * 0.2 +   // 服务区域匹配
  vehicleTypeScore * 0.15 +  // 车型匹配
  preferenceScore * 0.05     // 偏好匹配
```

### 数据库设计

```sql
-- 派单记录表
CREATE TABLE dispatch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    carrier_id INTEGER,
    match_score REAL,
    dispatch_mode TEXT,
    status TEXT,
    created_at DATETIME
);

-- 承运商偏好表
CREATE TABLE carrier_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrier_id INTEGER UNIQUE,
    preferred_areas TEXT,
    preferred_cargo_types TEXT,
    auto_accept_enabled INTEGER DEFAULT 0,
    auto_accept_radius_km REAL DEFAULT 10,
    min_order_amount REAL
);

-- 运力热力图片段表
CREATE TABLE capacity_heatmap (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    geohash TEXT,
    vehicle_count INTEGER,
    order_count INTEGER,
    supply_demand_ratio REAL,
    stat_time DATETIME
);

-- 派单配置表
CREATE TABLE dispatch_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_name TEXT,
    dispatch_mode TEXT,
    match_radius_km REAL DEFAULT 5,
    max_dispatch_count INTEGER DEFAULT 5,
    match_weights TEXT,
    is_enabled INTEGER DEFAULT 1
);
```

---

## 二、安全风控中心 🔥🔥

**参考对象**: 滴滴安全中心、Uber Safety Toolkit

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 紧急联系人 | 设置紧急联系人，自动通知 | P0 |
| 📱 小程序 | 一键报警 | 紧急情况快速报警（110） | P0 |
| 📱 小程序 | 行程分享 | 分享配送轨迹给亲友 | P0 |
| 📱 小程序 | 安全中心 | 安全知识、紧急求助入口 | P0 |
| 📱 小程序 | 偏航预警 | 配送路线严重偏离时提醒 | P1 |
| 📱 小程序 | 保险购买 | 购买货物运输保险 | P1 |
| 🖥️ PC 平台 | 安全监控大屏 | 实时监控所有在途订单安全状态 | P0 |
| 🖥️ PC 平台 | 异常事件处理 | 处理紧急报警、偏航、长时间停留 | P0 |
| 🖥️ PC 平台 | 黑名单管理 | 恶意用户、违规司机黑名单 | P0 |
| 🖥️ PC 平台 | 风控规则配置 | 配置风险识别规则 | P0 |
| 🖥️ PC 平台 | 保险理赔 | 保险购买记录、理赔处理 | P1 |
| 🚚 PC 承运商 | 安全培训 | 参加安全培训、考试 | P1 |
| 🚚 PC 承运商 | 事故上报 | 上报配送事故 | P0 |
| 🚚 PC 承运商 | 保险理赔申请 | 提交保险理赔申请 | P1 |

### 数据库设计

```sql
-- 安全事件表
CREATE TABLE safety_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    order_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    description TEXT,
    location_lat REAL,
    location_lng REAL,
    evidence TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    handled_by INTEGER,
    created_at DATETIME,
    resolved_at DATETIME
);

-- 紧急联系人表
CREATE TABLE emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    contact_name TEXT,
    contact_phone TEXT,
    relationship TEXT,
    notify_order INTEGER DEFAULT 1,
    is_enabled INTEGER DEFAULT 1
);

-- 黑名单表
CREATE TABLE blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_type TEXT,
    reason TEXT,
    reason_code TEXT,
    evidence TEXT,
    expire_at DATETIME,
    created_by INTEGER,
    created_at DATETIME
);

-- 风控规则表
CREATE TABLE risk_control_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT,
    rule_type TEXT,
    condition TEXT,
    action TEXT,
    threshold REAL,
    is_enabled INTEGER DEFAULT 1
);

-- 保险订单表
CREATE TABLE insurance_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER,
    insurance_type TEXT,
    insurance_company TEXT,
    policy_no TEXT,
    premium REAL,
    coverage REAL,
    status TEXT DEFAULT 'active',
    claim_amount REAL,
    claim_status TEXT,
    created_at DATETIME
);
```

---

## 三、充电桩管理模块 🔥

**参考对象**: 特斯拉充电网络、蔚来换电站

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 附近充电桩 | 地图显示附近充电桩 | P0 |
| 📱 小程序 | 充电桩详情 | 查看充电桩功率、空闲状态、价格 | P0 |
| 📱 小程序 | 充电预约 | 预约充电桩时段 | P1 |
| 📱 小程序 | 充电记录 | 查看历史充电记录 | P0 |
| 🖥️ PC 平台 | 充电桩管理 | 添加/编辑/删除充电桩 | P0 |
| 🖥️ PC 平台 | 状态监控 | 实时监控充电桩使用状态 | P0 |
| 🖥️ PC 平台 | 充电定价 | 配置充电服务价格 | P0 |
| 🖥️ PC 平台 | 充电统计 | 充电量、收入统计 | P1 |
| 🚚 PC 承运商 | 充电桩导航 | 导航至充电桩 | P0 |
| 🚚 PC 承运商 | 充电预约 | 预约充电桩 | P1 |
| 🚚 PC 承运商 | 充电记录 | 查看充电记录和费用 | P0 |

### 数据库设计

```sql
-- 充电桩表
CREATE TABLE charging_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    total_ports INTEGER,
    available_ports INTEGER,
    port_types TEXT,
    power_kw REAL,
    price_per_kwh REAL,
    service_fee_per_kwh REAL,
    status TEXT DEFAULT 'available'
);

-- 充电端口表
CREATE TABLE charging_ports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    port_no TEXT,
    port_type TEXT,
    power_kw REAL,
    status TEXT DEFAULT 'available',
    current_vehicle_id INTEGER
);

-- 充电记录表
CREATE TABLE charging_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    station_id INTEGER,
    port_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    energy_kwh REAL,
    cost REAL,
    service_fee REAL,
    total_cost REAL
);

-- 充电预约表
CREATE TABLE charging_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    station_id INTEGER,
    port_id INTEGER,
    reserved_time DATETIME,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'pending'
);
```

---

## 四、电子围栏模块 🔥

**参考对象**: 共享单车电子围栏、网约车服务区管理

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 服务区域提示 | 进入/离开服务区域时提示 | P1 |
| 📱 小程序 | 禁行区域预警 | 接近禁行区域时预警 | P1 |
| 🖥️ PC 平台 | 围栏管理 | 创建/编辑/删除电子围栏 | P0 |
| 🖥️ PC 平台 | 围栏类型 | 服务区域/禁行区域/停车区域/限速区域 | P0 |
| 🖥️ PC 平台 | 触发规则配置 | 配置进入/离开时的触发动作 | P0 |
| 🖥️ PC 平台 | 围栏监控 | 监控车辆进出围栏记录 | P0 |
| 🖥️ PC 平台 | 违规统计 | 禁行区域闯入统计 | P1 |
| 🚚 PC 承运商 | 围栏查看 | 查看各类电子围栏范围 | P0 |
| 🚚 PC 承运商 | 围栏预警 | 进出围栏时收到通知 | P0 |

### 数据库设计

```sql
-- 电子围栏表
CREATE TABLE geo_fences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_name TEXT,
    fence_type TEXT,
    polygon_coords TEXT,
    circle_center_lat REAL,
    circle_center_lng REAL,
    circle_radius_m REAL,
    trigger_event TEXT,
    action_type TEXT,
    action_config TEXT,
    is_enabled INTEGER DEFAULT 1
);

-- 围栏触发记录表
CREATE TABLE geo_fence_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    trigger_event TEXT,
    trigger_time DATETIME,
    location_lat REAL,
    location_lng REAL
);

-- 围栏违规记录表
CREATE TABLE geo_fence_violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    violation_type TEXT,
    violation_time DATETIME,
    penalty_amount REAL,
    penalty_points INTEGER,
    status TEXT DEFAULT 'pending'
);
```

---

## 五、维保管理模块 🔥

**参考对象**: 车企维保系统、车队管理系统

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 🖥️ PC 平台 | 维保计划管理 | 创建定期保养计划 | P0 |
| 🖥️ PC 平台 | 维保提醒 | 保养到期自动提醒 | P0 |
| 🖥️ PC 平台 | 维修记录 | 记录车辆维修历史 | P0 |
| 🖥️ PC 平台 | 维保成本统计 | 单车维保成本分析 | P1 |
| 🖥️ PC 平台 | 保险管理 | 车辆保险到期提醒 | P0 |
| 🖥️ PC 平台 | 保险理赔 | 保险理赔记录 | P1 |
| 🚚 PC 承运商 | 维保申请 | 申请车辆保养/维修 | P0 |
| 🚚 PC 承运商 | 维保记录 | 查看车辆维保历史 | P0 |
| 🚚 PC 承运商 | 保险查询 | 查看车辆保险信息 | P0 |

### 数据库设计

```sql
-- 维保计划表
CREATE TABLE maintenance_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT,
    vehicle_type TEXT,
    maintenance_type TEXT,
    interval_days INTEGER,
    interval_km INTEGER,
    maintenance_items TEXT,
    estimated_cost REAL
);

-- 维保记录表
CREATE TABLE maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    plan_id INTEGER,
    maintenance_type TEXT,
    description TEXT,
    cost REAL,
    service_provider TEXT,
    completed_at DATETIME,
    next_maintenance_at DATETIME
);

-- 车辆保险表
CREATE TABLE vehicle_insurances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    insurance_type TEXT,
    insurance_company TEXT,
    policy_no TEXT,
    coverage REAL,
    premium REAL,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'active'
);
```

---

## 六、积分商城模块 🔥

**参考对象**: 滴滴积分商城、航空公司里程计划

### 功能清单

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 积分查询 | 查看当前积分、积分明细 | P0 |
| 📱 小程序 | 积分任务 | 查看可获取积分的任务 | P0 |
| 📱 小程序 | 积分商城 | 浏览可兑换商品/优惠券 | P0 |
| 📱 小程序 | 积分兑换 | 使用积分兑换商品 | P0 |
| 📱 小程序 | 兑换记录 | 查看积分兑换历史 | P0 |
| 🖥️ PC 平台 | 积分规则配置 | 配置积分获取规则 | P0 |
| 🖥️ PC 平台 | 商品管理 | 添加/编辑/下架兑换商品 | P0 |
| 🖥️ PC 平台 | 订单管理 | 处理积分兑换订单 | P0 |
| 🖥️ PC 平台 | 积分统计 | 积分发放、消耗统计 | P1 |

### 数据库设计

```sql
-- 积分规则表
CREATE TABLE points_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT,
    action_type TEXT,
    points_amount INTEGER,
    daily_limit INTEGER,
    is_enabled INTEGER DEFAULT 1
);

-- 用户积分表
CREATE TABLE user_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    used_points INTEGER DEFAULT 0
);

-- 积分明细表
CREATE TABLE points_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    transaction_type TEXT,
    points_amount INTEGER,
    balance_after INTEGER,
    source_type TEXT,
    source_id INTEGER,
    created_at DATETIME
);

-- 积分商品表
CREATE TABLE points_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    product_type TEXT,
    points_price INTEGER,
    cash_price REAL,
    stock INTEGER,
    status TEXT DEFAULT 'active'
);

-- 积分兑换订单表
CREATE TABLE points_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    points_used INTEGER,
    cash_paid REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME
);
```

---

## 1.1.0 开发排期

| 阶段 | 周期 | 模块 | 工作量 |
|------|------|------|--------|
| 第一阶段 | 3 周 | 智能调度中心、安全风控中心 | 13 人天 |
| 第二阶段 | 2 周 | 充电桩管理、电子围栏、维保管理 | 10 人天 |
| 第三阶段 | 2 周 | 积分商城、优化迭代 | 7 人天 |
| **总计** | **7 周** | - | **30 人天** |

---

# 第三部分：附录

## 📊 数据库表汇总

### 1.0.1 新增表（~18 张）

| 模块 | 表名 |
|------|------|
| 订单扩展 | `multipoint_orders`、`delivery_points` |
| 支付扩展 | `payment_configs`、`payment_records`、`refund_records` |
| 营销模块 | `coupon_templates`、`user_coupons`、`recharge_promotions`、`invite_relations` |
| 客服模块 | `customer_service_sessions`、`service_messages`、`service_tickets`、`service_knowledge_base` |
| 评价信用 | `order_reviews`、`user_credit_scores` |
| 数据统计 | `daily_statistics`、`user_behavior_stats` |
| 车辆扩展 | `vehicle_status`、`vehicle_positions_history` |
| 智能匹配 | `dispatch_records`、`carrier_preferences` |
| 动态定价 | `pricing_factors`、`price_snapshots` |

### 1.1.0 新增表（~25 张）

| 模块 | 表名 |
|------|------|
| 智能调度 | `dispatch_records`、`carrier_preferences`、`capacity_heatmap`、`dispatch_configs` |
| 安全风控 | `safety_events`、`emergency_contacts`、`blacklist`、`risk_control_rules`、`insurance_orders`、`safety_training_records`、`trip_shares` |
| 充电桩管理 | `charging_stations`、`charging_ports`、`charging_records`、`charging_reservations` |
| 电子围栏 | `geo_fences`、`geo_fence_triggers`、`geo_fence_violations` |
| 维保管理 | `maintenance_plans`、`maintenance_records`、`vehicle_insurances` |
| 积分商城 | `points_rules`、`user_points`、`points_transactions`、`points_products`、`points_orders` |

---

## 📦 API 文件结构

### 1.0.1 新增 API 处理器

```
backend/api/handlers/
│
├── 📂 customer/order/
│   ├── createMultipointOrder.js
│   ├── getMultipointOrder.js
│   ├── addDeliveryPoint.js
│   └── ...
│
├── 📂 customer/payment/
│   ├── mixedPay.js
│   ├── calculatePayment.js
│   ├── applyRefund.js
│   └── ...
│
├── 📂 customer/marketing/
│   ├── getAvailableCoupons.js
│   ├── getMyCoupons.js
│   ├── receiveCoupon.js
│   └── ...
│
├── 📂 customer/service/
│   ├── startChat.js
│   ├── sendMessage.js
│   ├── createTicket.js
│   └── ...
│
├── 📂 admin/payment/
│   ├── getConfig.js
│   ├── getRefundList.js
│   ├── approveRefund.js
│   └── ...
│
├── 📂 admin/marketing/
│   ├── listCoupons.js
│   ├── createCoupon.js
│   └── ...
│
├── 📂 admin/service/
│   ├── getSessionList.js
│   ├── replyTicket.js
│   └── ...
│
└── 📂 carrier/order/
    ├── claimMultipointOrder.js
    ├── checkinPoint.js
    └── ...
```

### 1.1.0 新增 API 处理器

```
backend/api/handlers/
│
├── 📂 dispatch/
│   ├── getNearestVehicle.js
│   ├── getETA.js
│   ├── matchOrderToCarriers.js
│   └── ...
│
├── 📂 customer/safety/
│   ├── getEmergencyContacts.js
│   ├── sendAlert.js
│   ├── shareTrip.js
│   └── ...
│
├── 📂 customer/charging/
│   ├── getStations.js
│   ├── reserveCharging.js
│   └── ...
│
├── 📂 customer/points/
│   ├── getBalance.js
│   ├── getProducts.js
│   ├── exchangeProduct.js
│   └── ...
│
└── 📂 admin/ (各模块管理端 API)
```

---

## ✅ 验收标准

### 功能验收

- [ ] 一单多点支持至少 5 个卸货点，路径自动优化
- [ ] 混合支付支持现金 + 优惠券组合，支付比例可配置
- [ ] 退款流程支持原路返回，优惠券可退回
- [ ] 优惠券系统支持创建、发放、核销全流程
- [ ] 在线客服支持实时聊天、工单流转
- [ ] 双向评价支持客户评承运商、承运商评客户
- [ ] 智能调度支持 GeoHash 匹配，响应时间 < 3 秒
- [ ] 安全风控支持一键报警，响应时间 < 1 秒
- [ ] 充电桩支持状态监控、预约功能
- [ ] 电子围栏支持多边形和圆形，触发延迟 < 5 秒

### 性能验收

- [ ] 支付计算响应时间 < 500ms
- [ ] 多点路径规划响应时间 < 2s
- [ ] 车辆位置更新延迟 < 5s
- [ ] 客服消息推送延迟 < 1s
- [ ] 运力热力图更新频率 < 1 分钟

### 安全验收

- [ ] 支付接口防重放攻击
- [ ] 优惠券防刷机制（每人限领、IP 限制）
- [ ] 退款审核权限控制
- [ ] 敏感数据加密存储
- [ ] 紧急报警多渠道通知

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-02-21 | 初始版本，整合 1.0.1 和 1.1.0 规划 | - |

---

**文档版本**: 1.0  
**最后更新**: 2026-02-21  
**状态**: 已审批
