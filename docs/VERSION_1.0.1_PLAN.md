# 数孪智运无人物流 SaaS 平台 - 1.0.1 版本功能扩展计划

**生成时间**: 2026-02-21  
**项目版本**: 1.0.1  
**文档类型**: 功能扩展开发计划（基于现有功能深化）

---

## 📋 版本概述

1.0.1 版本在 1.0.x 现有功能基础上，参考**网约车**（滴滴/Uber）和**无人物流平台**行业实践，对已有模块进行深化扩展。

### 版本定位

| 版本 | 定位 | 内容 |
|------|------|------|
| **1.0.x** | 基础功能 | 订单、租户、车辆、地图、钱包、结算 |
| **1.0.1** | 功能深化 | 一单多点、混合支付、优惠券、客服、评价信用、数据统计 |
| **1.1.0** | 新增模块 | 智能调度、安全风控、充电桩、电子围栏、维保管理、积分商城 |

---

## 🎯 1.0.1 功能扩展详细规划

### 一、订单模块扩展（基于现有 orders 表）

#### 1.1 一单多点卸货 🔥

**扩展现有**: `orders` 表、`/api/av-route/multi-point`

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

**数据库扩展**:
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

**新增 API**:
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

#### 1.2 订单全生命周期追踪

**扩展现有**: `orders.status`

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 订单状态追踪 | 实时查看订单当前状态 | P0 |
| 📱 小程序 | 状态变更通知 | 订单状态变更推送提醒 | P1 |
| 🖥️ PC 平台 | 订单状态监控 | 查看所有订单状态分布 | P0 |
| 🖥️ PC 平台 | 异常订单预警 | 超时未接单、长时间未配送预警 | P0 |
| 🚚 PC 承运商 | 状态上报 | 更新订单执行状态 | P0 |

**订单状态扩展**:
```
pending → 待接单
assigned → 已分配/已接单
pickup_done → 已取货
in_delivery → 配送中
at_delivery_point → 到达卸货点
delivered → 已送达
completed → 已完成
cancelled → 已取消
refunded → 已退款
```

---

#### 1.3 智能匹配/派单

**扩展现有**: `matching` 标签、`/api/carrier/order/claim`

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 🖥️ PC 平台 | 派单模式配置 | 抢单/派单/混合模式切换 | P0 |
| 🖥️ PC 平台 | 匹配规则配置 | 配置匹配权重（距离、评分、服务区域） | P0 |
| 🖥️ PC 平台 | 派单记录查询 | 查看派单历史、成功率 | P1 |
| 🚚 PC 承运商 | 自动接单设置 | 设置自动接单条件（区域、货物类型） | P1 |
| 🚚 PC 承运商 | 派单偏好 | 设置偏好订单类型、区域 | P1 |

**数据库扩展**:
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

#### 1.4 动态定价

**扩展现有**: `pricing_rules` 表

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

**数据库扩展**:
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

-- 价格快照表（用于追溯）
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

### 二、支付模块扩展（基于现有 wallet 模块）

#### 2.1 混合支付 🔥

**扩展现有**: `wallet` 表、`/api/wallet/recharge`

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

**数据库扩展**:
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
    status TEXT DEFAULT 'pending',  -- pending/auditing/approved/rejected/processed
    audit_by INTEGER,
    audit_at DATETIME,
    processed_at DATETIME,
    refund_method TEXT,             -- original_path/balance
    created_at DATETIME
);
```

**新增 API**:
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

### 三、营销模块扩展（新增）

#### 3.1 优惠券系统 🔥

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

**数据库扩展**:
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
    valid_days INTEGER,               -- 领取后有效天数
    total_quantity INTEGER,
    issued_quantity INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    applicable_scope TEXT,            -- all/specific_carriers/specific_areas
    status TEXT DEFAULT 'active',
    created_at DATETIME
);

-- 用户优惠券表
CREATE TABLE user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    template_id INTEGER,
    coupon_code TEXT UNIQUE,
    status TEXT DEFAULT 'unused',     -- unused/used/expired/locked
    obtained_at DATETIME,
    used_at DATETIME,
    expired_at DATETIME,
    order_id INTEGER
);

-- 充值活动配置表
CREATE TABLE recharge_promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recharge_amount REAL,             -- 充值金额
    bonus_amount REAL,                -- 赠送金额
    bonus_coupon_template_id INTEGER, -- 赠送优惠券模板 ID
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

### 四、客服模块扩展（新增）

#### 4.1 在线客服与工单系统 🔥

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

**数据库扩展**:
```sql
-- 客服会话表
CREATE TABLE customer_service_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_no TEXT UNIQUE,
    customer_id INTEGER,
    agent_id INTEGER,
    status TEXT DEFAULT 'pending',    -- pending/active/closed/transferred
    source TEXT,                      -- chat/phone/complaint
    created_at DATETIME,
    closed_at DATETIME,
    rating INTEGER,                   -- 满意度评分 1-5
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
    images TEXT,                      -- JSON 数组
    status TEXT DEFAULT 'open',       -- open/processing/resolved/closed
    priority TEXT DEFAULT 'normal',   -- low/normal/high/urgent
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
    keywords TEXT,                    -- JSON 数组
    view_count INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);
```

---

### 五、评价信用扩展（基于现有违规管理）

#### 5.1 双向评价与信用分 🔥

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

**数据库扩展**:
```sql
-- 订单评价表
CREATE TABLE order_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    reviewer_id INTEGER,
    reviewee_id INTEGER,
    reviewer_type TEXT,             -- customer/carrier
    rating INTEGER,                 -- 1-5 星
    tags TEXT,                      -- JSON 标签
    comment TEXT,
    is_anonymous INTEGER DEFAULT 0,
    reply TEXT,                     -- 回复
    created_at DATETIME
);

-- 用户信用分表
CREATE TABLE user_credit_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_type TEXT,                 -- customer/carrier
    credit_score INTEGER DEFAULT 100,
    completion_rate REAL,           -- 履约率
    avg_rating REAL,                -- 平均评分
    violation_count INTEGER,        -- 违规次数
    last_updated DATETIME
);
```

---

### 六、数据统计扩展（基于现有 reports）

#### 6.1 运营数据与财务报表 🔥

**扩展现有**: `/api/admin/reports/overview-stats`

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

**数据库扩展**:
```sql
-- 运营统计表（按日聚合）
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

### 七、车辆/运力扩展（基于现有 vehicle 模块）

#### 7.1 车辆状态与实时追踪

**扩展现有**: `vehicle_tracking` 表、`/api/vehicle-tracking/*`

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

**数据库扩展**:
```sql
-- 车辆状态表
CREATE TABLE vehicle_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER UNIQUE,
    status TEXT,                    -- idle/serving/charging/maintenance/offline
    battery_level REAL,             -- 电量百分比
    current_lat REAL,
    current_lng REAL,
    last_update DATETIME
);

-- 车辆位置历史表（分表存储）
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

## 📊 开发优先级与排期

### 第一阶段（2 周）- 核心业务扩展

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 订单扩展 | 一单多点卸货 | 5 |
| 支付扩展 | 混合支付、退款流程 | 4 |
| 车辆扩展 | 车辆状态、实时追踪 | 3 |
| **小计** | | **12 人天** |

### 第二阶段（2 周）- 营销与客服

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 营销模块 | 优惠券系统、充值活动 | 5 |
| 客服模块 | 在线客服、工单系统 | 4 |
| 评价信用 | 双向评价、信用分 | 3 |
| **小计** | | **12 人天** |

### 第三阶段（2 周）- 运营与优化

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 数据统计 | 运营大屏、财务报表 | 4 |
| 订单扩展 | 智能匹配、动态定价 | 4 |
| 优化迭代 | 性能优化、Bug 修复 | 2 |
| **小计** | | **10 人天** |

### 总计

| 指标 | 数值 |
|------|------|
| 总周期 | 6 周 |
| 总工作量 | 34 人天 |
| 新增数据库表 | ~18 张 |
| 新增 API 接口 | ~50 个 |
| 新增前端页面 | ~40 个 |

---

## 🗄️ 数据库表汇总（1.0.1 新增）

| 模块 | 新增表 |
|------|--------|
| 订单扩展 | `multipoint_orders`、`delivery_points` |
| 支付扩展 | `payment_configs`、`payment_records`、`refund_records` |
| 营销模块 | `coupon_templates`、`user_coupons`、`recharge_promotions`、`invite_relations` |
| 客服模块 | `customer_service_sessions`、`service_messages`、`service_tickets`、`service_knowledge_base` |
| 评价信用 | `order_reviews`、`user_credit_scores` |
| 数据统计 | `daily_statistics`、`user_behavior_stats` |
| 车辆扩展 | `vehicle_status`、`vehicle_positions_history` |
| 智能匹配 | `dispatch_records`、`carrier_preferences` |
| 动态定价 | `pricing_factors`、`price_snapshots` |

---

## 📦 后端 API 文件结构

```
backend/api/handlers/
│
├── 📂 customer/order/
│   ├── createMultipointOrder.js      # 创建多点订单
│   ├── getMultipointOrder.js         # 多点订单详情
│   ├── updateMultipointOrder.js      # 更新多点订单
│   ├── addDeliveryPoint.js           # 添加卸货点
│   ├── deleteDeliveryPoint.js        # 删除卸货点
│   └── reorderPoints.js              # 调整卸货点顺序
│
├── 📂 customer/payment/
│   ├── mixedPay.js                   # 混合支付
│   ├── calculatePayment.js           # 计算支付明细
│   ├── applyRefund.js                # 申请退款
│   └── getRefundStatus.js            # 退款进度
│
├── 📂 customer/marketing/
│   ├── getAvailableCoupons.js        # 可用优惠券
│   ├── getMyCoupons.js               # 我的优惠券
│   ├── receiveCoupon.js              # 领取优惠券
│   └── getInviteCode.js              # 获取邀请码
│
├── 📂 customer/service/
│   ├── startChat.js                  # 发起聊天
│   ├── sendMessage.js                # 发送消息
│   ├── getChatHistory.js             # 聊天记录
│   ├── createTicket.js               # 创建工单
│   └── getTicketList.js              # 工单列表
│
├── 📂 admin/order/
│   ├── listMultipointOrders.js       # 多点订单列表
│   ├── optimizeRoute.js              # 路径优化
│   └── handleException.js            # 处理异常
│
├── 📂 admin/payment/
│   ├── getConfig.js                  # 支付配置
│   ├── updateConfig.js               # 更新支付配置
│   ├── getRefundList.js              # 退款申请列表
│   ├── approveRefund.js              # 审核退款
│   ├── processRefund.js              # 执行退款
│   └── getReconciliation.js          # 对账报表
│
├── 📂 admin/marketing/
│   ├── listCoupons.js                # 优惠券列表
│   ├── createCoupon.js               # 创建优惠券
│   ├── listTemplates.js              # 券模板列表
│   ├── createTemplate.js             # 创建券模板
│   └── getRechargeConfig.js          # 充值配置
│
├── 📂 admin/service/
│   ├── getSessionList.js             # 会话列表
│   ├── assignSession.js              # 分配会话
│   ├── getTicketList.js              # 工单列表
│   ├── replyTicket.js                # 工单回复
│   └── getQualityStats.js            # 服务质量统计
│
├── 📂 admin/reports/
│   ├── getDashboard.js               # 运营大屏
│   ├── getOrderAnalysis.js           # 订单分析
│   ├── getRevenueAnalysis.js         # 收入分析
│   └── getFinancialReport.js         # 财务报表
│
├── 📂 carrier/order/
│   ├── claimMultipointOrder.js       # 抢多点订单
│   ├── checkinPoint.js               # 卸货点签收
│   └── reportPointException.js       # 上报异常
│
└── 📂 carrier/payment/
    ├── getReceiveRecords.js          # 收款记录
    └── getSettlement.js              # 结算对账
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
- [ ] 运营大屏实时展示订单、收入、运力数据

### 性能验收

- [ ] 支付计算响应时间 < 500ms
- [ ] 多点路径规划响应时间 < 2s
- [ ] 车辆位置更新延迟 < 5s
- [ ] 客服消息推送延迟 < 1s

### 安全验收

- [ ] 支付接口防重放攻击
- [ ] 优惠券防刷机制（每人限领、IP 限制）
- [ ] 退款审核权限控制
- [ ] 敏感数据加密存储

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| 1.0.1 | 2026-02-21 | 初始版本，规划 1.0.1 功能扩展 | - |

---

**文档版本**: 1.0.1  
**最后更新**: 2026-02-21  
**状态**: 待评审
