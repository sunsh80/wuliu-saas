# 数孪智运无人物流 SaaS 平台 v1.0.1 版本开发计划

**版本目标**: 健全核心业务模块，完善商业闭环  
**制定时间**: 2026-02-21  
**优先级**: P0(必须) | P1(重要) | P2(可选)

---

## 📋 版本概述

v1.0.0 版本已完成基础业务功能（订单、车辆、路线、钱包基础），v1.0.1 版本重点补充：

1. **客服系统** - 客诉处理、远程驾驶支持
2. **营销中心** - 充值优惠、赠券、积分、拉新、奖励
3. **支付扩展** - 微信/券付/积分/混合支付/退款
4. **运营后台** - 数据看板、用户运营、活动管理
5. **缺失环节** - 评价系统、消息通知、保险理赔等

---

## 🗺️ 模块总览

```
v1.0.1 新增模块
│
├── 📞 客服系统 (Customer Service)
│   ├── 客诉管理
│   ├── 在线客服
│   ├── 远程驾驶支持
│   └── 工单系统
│
├── 🎁 营销中心 (Marketing)
│   ├── 充值优惠
│   ├── 优惠券管理
│   ├── 积分系统
│   ├── 拉新奖励
│   └── 任务奖励
│
├── 💳 支付中心 (Payment)
│   ├── 微信支付
│   ├── 券付
│   ├── 积分兑换
│   ├── 混合支付
│   └── 退款管理
│
├── 📊 运营后台 (Operation)
│   ├── 数据看板
│   ├── 用户运营
│   ├── 活动管理
│   └── 内容管理
│
├── ⭐ 评价系统 (Review)
│   ├── 订单评价
│   ├── 服务评分
│   └── 信用体系
│
├── 🔔 消息中心 (Notification)
│   ├── 站内信
│   ├── 推送通知
│   └── 短信/邮件
│
├── 🛡️ 保险理赔 (Insurance)
│   ├── 投保管理
│   ├── 理赔申请
│   └── 理赔进度
│
└── 📱 小程序增强 (Mini Program)
    ├── 客服会话
    ├── 营销中心
    └── 支付流程
```

---

## 📞 模块一：客服系统

### 1.1 数据库表设计

```sql
-- 客服工单表
CREATE TABLE customer_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_no TEXT UNIQUE NOT NULL,          -- 工单编号
  user_id INTEGER NOT NULL,                 -- 用户 ID
  order_id INTEGER,                         -- 关联订单 ID
  type TEXT NOT NULL,                       -- 类型：complaint(投诉), consultation(咨询), suggestion(建议), emergency(紧急)
  title TEXT NOT NULL,                      -- 标题
  content TEXT NOT NULL,                    -- 内容
  status TEXT DEFAULT 'pending',            -- 状态：pending(待处理), processing(处理中), resolved(已解决), closed(已关闭)
  priority TEXT DEFAULT 'normal',           -- 优先级：low, normal, high, urgent
  assigned_to INTEGER,                      -- 分配给客服 ID
  category TEXT,                            -- 分类：order(订单), payment(支付), vehicle(车辆), system(系统), other(其他)
  
  -- 远程驾驶支持字段
  remote_drive_request BOOLEAN DEFAULT 0,   -- 是否请求远程驾驶
  remote_drive_reason TEXT,                 -- 远程驾驶原因
  vehicle_id INTEGER,                       -- 需要远程驾驶的车辆 ID
  
  -- 处理信息
  response_content TEXT,                    -- 客服回复内容
  resolved_at DATETIME,                     -- 解决时间
  closed_at DATETIME,                       -- 关闭时间
  satisfaction_score INTEGER,               -- 满意度评分 (1-5)
  satisfaction_comment TEXT,                -- 满意度评价
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id)
);

-- 客服会话表
CREATE TABLE customer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,          -- 会话 ID
  user_id INTEGER NOT NULL,                 -- 用户 ID
  agent_id INTEGER,                         -- 客服 ID
  status TEXT DEFAULT 'active',             -- 状态：active(进行中), ended(已结束)
  last_message_at DATETIME,                 -- 最后消息时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- 客服消息表
CREATE TABLE customer_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,                 -- 会话 ID
  sender_id INTEGER NOT NULL,               -- 发送者 ID
  message_type TEXT DEFAULT 'text',         -- 类型：text, image, file, system
  content TEXT NOT NULL,                    -- 消息内容
  is_read BOOLEAN DEFAULT 0,                -- 是否已读
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES customer_sessions(session_id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 远程驾驶记录表
CREATE TABLE remote_drive_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,               -- 关联工单 ID
  vehicle_id INTEGER NOT NULL,              -- 车辆 ID
  operator_id INTEGER NOT NULL,             -- 操作员 ID
  start_time DATETIME,                      -- 开始时间
  end_time DATETIME,                        -- 结束时间
  duration_seconds INTEGER,                 -- 时长 (秒)
  start_location TEXT,                      -- 开始位置 (JSON: {lat, lng, address})
  end_location TEXT,                        -- 结束位置 (JSON)
  route_data TEXT,                          -- 行驶路线 (JSON)
  status TEXT DEFAULT 'pending',            -- 状态：pending, in_progress, completed, cancelled
  reason TEXT,                              -- 远程驾驶原因
  notes TEXT,                               -- 备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES customer_tickets(id),
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 客服配置表
CREATE TABLE customer_service_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 客服排班表
CREATE TABLE customer_service_shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,                -- 客服 ID
  shift_date DATE NOT NULL,                 -- 日期
  start_time TIME NOT NULL,                 -- 开始时间
  end_time TIME NOT NULL,                   -- 结束时间
  status TEXT DEFAULT 'scheduled',          -- 状态：scheduled, on_duty, off_duty, absent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id),
  UNIQUE(agent_id, shift_date, start_time)
);
```

### 1.2 API Handlers

```
backend/api/handlers/customer-service/
├── 📂 tickets/                  # 工单管理
│   ├── createTicket.js          # 创建工单 (P0)
│   ├── listTickets.js           # 工单列表 (P0)
│   ├── getTicketDetail.js       # 工单详情 (P0)
│   ├── updateTicket.js          # 更新工单 (P0)
│   ├── assignTicket.js          # 分配工单 (P0)
│   ├── resolveTicket.js         # 解决工单 (P0)
│   ├── closeTicket.js           # 关闭工单 (P1)
│   └── submitSatisfaction.js    # 提交满意度 (P1)
│
├── 📂 sessions/                 # 会话管理
│   ├── createSession.js         # 创建会话 (P1)
│   ├── listSessions.js          # 会话列表 (P1)
│   ├── endSession.js            # 结束会话 (P1)
│   └── getSessionHistory.js     # 会话历史 (P2)
│
├── 📂 messages/                 # 消息管理
│   ├── sendMessage.js           # 发送消息 (P1)
│   ├── listMessages.js          # 消息列表 (P1)
│   └── markAsRead.js            # 标记已读 (P1)
│
├── 📂 remote-drive/             # 远程驾驶
│   ├── requestRemoteDrive.js    # 请求远程驾驶 (P0)
│   ├── approveRemoteDrive.js    # 审批远程驾驶 (P0)
│   ├── startRemoteDrive.js      # 开始远程驾驶 (P0)
│   ├── endRemoteDrive.js        # 结束远程驾驶 (P0)
│   ├── getRemoteDriveRecord.js  # 获取记录 (P1)
│   └── listRemoteDriveRecords.js# 记录列表 (P1)
│
└── 📂 config/                   # 配置管理
    ├── getServiceConfig.js      # 获取配置 (P1)
    └── updateServiceConfig.js   # 更新配置 (P1)
```

### 1.3 业务流程

```
客诉流程:
用户提交工单 → 系统分配客服 → 客服处理 → 用户确认 → 满意度评价

远程驾驶流程:
用户请求 → 客服审核 → 分配操作员 → 开始远程驾驶 → 结束 → 记录存档
```

---

## 🎁 模块二：营销中心

### 2.1 数据库表设计

```sql
-- 优惠券模板表
CREATE TABLE coupon_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                       -- 券名称
  type TEXT NOT NULL,                       -- 类型：discount(折扣), fixed(满减), percentage(百分比)
  value REAL NOT NULL,                      -- 面值/折扣率
  min_order_amount REAL,                    -- 最低订单金额
  max_discount_amount REAL,                 -- 最大折扣金额 (折扣券用)
  total_quantity INTEGER NOT NULL,          -- 发放总量
  issued_quantity INTEGER DEFAULT 0,        -- 已发放数量
  used_quantity INTEGER DEFAULT 0,          -- 已使用数量
  valid_start DATETIME NOT NULL,            -- 有效期开始
  valid_end DATETIME NOT NULL,              -- 有效期结束
  applicable_users TEXT,                    -- 适用用户：all, new, old, specific
  applicable_orders TEXT,                   -- 适用订单类型：all, first, specific
  status TEXT DEFAULT 'active',             -- 状态：active, inactive, exhausted
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户优惠券表
CREATE TABLE user_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  template_id INTEGER NOT NULL,             -- 模板 ID
  coupon_code TEXT UNIQUE NOT NULL,         -- 优惠券码
  status TEXT DEFAULT 'unused',             -- 状态：unused, used, expired, locked
  order_id INTEGER,                         -- 使用的订单 ID
  valid_start DATETIME NOT NULL,            -- 有效期开始
  valid_end DATETIME NOT NULL,              -- 有效期结束
  used_at DATETIME,                         -- 使用时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES coupon_templates(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 积分账户表
CREATE TABLE points_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,          -- 用户 ID
  total_points INTEGER DEFAULT 0,           -- 总积分
  available_points INTEGER DEFAULT 0,       -- 可用积分
  frozen_points INTEGER DEFAULT 0,          -- 冻结积分
  used_points INTEGER DEFAULT 0,            -- 已使用积分
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 积分流水表
CREATE TABLE points_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  account_id INTEGER NOT NULL,              -- 账户 ID
  type TEXT NOT NULL,                       -- 类型：earn(获得), spend(消费), freeze(冻结), unfreeze(解冻)
  points INTEGER NOT NULL,                  -- 积分数量
  balance_after INTEGER,                    -- 变更后余额
  source TEXT NOT NULL,                     -- 来源：order(订单), activity(活动), refund(退款), admin(管理员)
  source_id TEXT,                           -- 来源 ID (订单 ID 等)
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES points_accounts(id)
);

-- 积分规则表
CREATE TABLE points_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,                  -- 规则名称
  rule_type TEXT NOT NULL,                  -- 类型：order(订单), daily_signin(签到), activity(活动)
  points_amount INTEGER NOT NULL,           -- 积分数量
  condition_json TEXT,                      -- 条件配置 (JSON)
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 充值优惠规则表
CREATE TABLE recharge_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_amount REAL NOT NULL,                 -- 最低充值金额
  max_amount REAL,                          -- 最高充值金额
  bonus_type TEXT NOT NULL,                 -- 奖励类型：points(积分), coupon(券), cash(现金)
  bonus_value REAL NOT NULL,                -- 奖励值
  bonus_description TEXT,
  valid_start DATETIME,                     -- 有效期开始
  valid_end DATETIME,                       -- 有效期结束
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 拉新活动表
CREATE TABLE referral_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_name TEXT NOT NULL,              -- 活动名称
  referrer_reward_type TEXT NOT NULL,       -- 推荐人奖励：points, coupon, cash
  referrer_reward_value REAL NOT NULL,      -- 推荐人奖励值
  referee_reward_type TEXT NOT NULL,        -- 被推荐人奖励
  referee_reward_value REAL NOT NULL,       -- 被推荐人奖励值
  min_order_amount REAL,                    -- 最低订单金额要求
  max_referrals INTEGER,                    -- 最大推荐次数
  total_budget REAL,                        -- 总预算
  used_budget REAL DEFAULT 0,               -- 已用预算
  valid_start DATETIME NOT NULL,
  valid_end DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 拉新记录表
CREATE TABLE referral_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,             -- 推荐人 ID
  referee_id INTEGER NOT NULL,              -- 被推荐人 ID
  activity_id INTEGER NOT NULL,             -- 活动 ID
  referrer_reward INTEGER,                  -- 推荐人获得积分
  referee_reward INTEGER,                   -- 被推荐人获得积分
  status TEXT DEFAULT 'pending',            -- 状态：pending, completed, invalid
  completed_at DATETIME,                    -- 完成时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id),
  FOREIGN KEY (activity_id) REFERENCES referral_activities(id)
);

-- 任务系统表
CREATE TABLE user_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_name TEXT NOT NULL,                  -- 任务名称
  task_type TEXT NOT NULL,                  -- 类型：daily(每日), one_time(一次性), achievement(成就)
  description TEXT,                         -- 任务描述
  reward_type TEXT NOT NULL,                -- 奖励类型：points, coupon, cash
  reward_value REAL NOT NULL,               -- 奖励值
  condition_json TEXT,                      -- 完成条件 (JSON)
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户任务进度表
CREATE TABLE user_task_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  task_id INTEGER NOT NULL,                 -- 任务 ID
  progress INTEGER DEFAULT 0,               -- 当前进度
  target INTEGER NOT NULL,                  -- 目标进度
  status TEXT DEFAULT 'in_progress',        -- 状态：in_progress, completed, claimed
  completed_at DATETIME,                    -- 完成时间
  claimed_at DATETIME,                      -- 领取时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES user_tasks(id),
  UNIQUE(user_id, task_id)
);

-- 签到记录表
CREATE TABLE daily_signins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  signin_date DATE NOT NULL,                -- 签到日期
  continuous_days INTEGER DEFAULT 1,        -- 连续签到天数
  points_earned INTEGER,                    -- 获得积分
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, signin_date)
);
```

### 2.2 API Handlers

```
backend/api/handlers/marketing/
├── 📂 coupons/                  # 优惠券
│   ├── listCouponTemplates.js   # 券模板列表 (P0)
│   ├── getCouponTemplate.js     # 券模板详情 (P0)
│   ├── claimCoupon.js           # 领取优惠券 (P0)
│   ├── listUserCoupons.js       # 我的优惠券 (P0)
│   ├── useCoupon.js             # 使用优惠券 (P0)
│   └── cancelCoupon.js          # 取消使用券 (P1)
│
├── 📂 points/                   # 积分
│   ├── getPointsAccount.js      # 积分账户 (P0)
│   ├── listPointsTransactions.js# 积分流水 (P0)
│   ├── earnPoints.js            # 获得积分 (P0)
│   ├── spendPoints.js           # 消费积分 (P0)
│   ├── listPointsRules.js       # 积分规则 (P1)
│   └── dailySignin.js           # 每日签到 (P1)
│
├── 📂 recharge/                 # 充值优惠
│   ├── listRechargeRules.js     # 充值规则列表 (P0)
│   ├── calculateRechargeBonus.js# 计算充值奖励 (P0)
│   └── applyRechargeRule.js     # 应用充值规则 (P0)
│
├── 📂 referral/                 # 拉新
│   ├── listReferralActivities.js# 拉新活动列表 (P0)
│   ├── generateReferralCode.js  # 生成推荐码 (P0)
│   ├── submitReferral.js        # 提交推荐 (P0)
│   └── listReferralRecords.js   # 推荐记录 (P1)
│
├── 📂 tasks/                    # 任务
│   ├── listUserTasks.js         # 任务列表 (P1)
│   ├── getTaskProgress.js       # 任务进度 (P1)
│   ├── updateTaskProgress.js    # 更新进度 (P1)
│   └── claimTaskReward.js       # 领取奖励 (P1)
│
└── 📂 activities/               # 活动管理
    ├── listActivities.js        # 活动列表 (P1)
    ├── getActivityDetail.js     # 活动详情 (P1)
    └── joinActivity.js          # 参与活动 (P1)
```

---

## 💳 模块三：支付中心

### 3.1 数据库表设计

```sql
-- 支付订单表
CREATE TABLE payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_no TEXT UNIQUE NOT NULL,          -- 支付单号
  order_id INTEGER NOT NULL,                -- 关联订单 ID
  user_id INTEGER NOT NULL,                 -- 用户 ID
  total_amount REAL NOT NULL,               -- 总金额
  paid_amount REAL DEFAULT 0,               -- 已支付金额
  
  -- 支付方式分解
  wallet_balance_amount REAL DEFAULT 0,     -- 钱包余额支付
  recharge_amount REAL DEFAULT 0,           -- 充值款支付
  coupon_amount REAL DEFAULT 0,             -- 优惠券抵扣
  points_amount REAL DEFAULT 0,             -- 积分抵扣
  wechat_amount REAL DEFAULT 0,             -- 微信支付
  cash_supplement REAL DEFAULT 0,           -- 现金补充
  
  -- 支付配置要求
  min_cash_ratio REAL DEFAULT 0.05,         -- 最低现金比例 (默认 5%)
  
  -- 支付状态
  status TEXT DEFAULT 'pending',            -- 状态：pending, partial, completed, failed, refunded
  payment_method TEXT,                      -- 支付方式：wallet, wechat, hybrid(混合)
  
  -- 第三方支付
  wechat_transaction_id TEXT,               -- 微信交易单号
  wechat_pay_time DATETIME,                 -- 微信支付时间
  
  -- 时间
  paid_at DATETIME,                         -- 支付完成时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 支付配置表
CREATE TABLE payment_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 退款记录表
CREATE TABLE refund_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  refund_no TEXT UNIQUE NOT NULL,           -- 退款单号
  payment_id INTEGER NOT NULL,              -- 支付 ID
  order_id INTEGER NOT NULL,                -- 订单 ID
  user_id INTEGER NOT NULL,                 -- 用户 ID
  refund_amount REAL NOT NULL,              -- 退款金额
  
  -- 退款分解
  refund_wechat REAL DEFAULT 0,             -- 退微信
  refund_wallet REAL DEFAULT 0,             -- 退钱包
  refund_recharge REAL DEFAULT 0,           -- 退充值款
  refund_coupon REAL DEFAULT 0,             -- 退券 (不退，只记录)
  refund_points REAL DEFAULT 0,             -- 退积分 (不退，只记录)
  
  -- 退款原因
  reason TEXT NOT NULL,                     -- 退款原因
  reason_type TEXT,                         -- 原因类型：user_cancel(用户取消), system_error(系统错误), dispute(争议)
  
  -- 退款状态
  status TEXT DEFAULT 'pending',            -- 状态：pending, processing, completed, failed, rejected
  processed_by INTEGER,                     -- 处理人 ID
  
  -- 时间
  processed_at DATETIME,                    -- 处理时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payment_orders(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- 钱包扩展表 (在原有 wallets 表基础上新增)
ALTER TABLE wallets ADD COLUMN recharge_balance REAL DEFAULT 0;  -- 充值款余额
ALTER TABLE wallets ADD COLUMN cash_balance REAL DEFAULT 0;      -- 现金余额
ALTER TABLE wallets ADD COLUMN coupon_balance REAL DEFAULT 0;    -- 券余额 (虚拟)
ALTER TABLE wallets ADD COLUMN points_balance INTEGER DEFAULT 0; -- 积分余额 (虚拟)
```

### 3.2 支付逻辑流程

```
支付顺序 (优先级从高到低):
1. 钱包充值款 (优先使用)
2. 现金补充 (微信支付，当充值款不足时)
3. 优惠券 (现金 + 充值款 >= 95% 后才能使用)
4. 积分兑换 (最后使用)

约束条件:
- 现金 + 充值款 >= 订单金额的 95%
- 优惠券 + 积分 <= 订单金额的 5%
```

### 3.3 API Handlers

```
backend/api/handlers/payment/
├── 📂 orders/                   # 支付订单
│   ├── createPaymentOrder.js    # 创建支付单 (P0)
│   ├── getPaymentOrder.js       # 支付单详情 (P0)
│   ├── listPaymentOrders.js     # 支付单列表 (P1)
│   └── cancelPaymentOrder.js    # 取消支付单 (P1)
│
├── 📂 methods/                  # 支付方式
│   ├── payByWechat.js           # 微信支付 (P0)
│   ├── payByWallet.js           # 钱包支付 (P0)
│   ├── payByHybrid.js           # 混合支付 (P0)
│   └── calculatePaymentPlan.js  # 计算支付方案 (P0)
│
├── 📂 coupons/                  # 券支付
│   ├── applyCoupon.js           # 使用优惠券 (P0)
│   └── removeCoupon.js          # 移除优惠券 (P0)
│
├── 📂 points/                   # 积分支付
│   ├── applyPoints.js           # 使用积分 (P0)
│   └── removePoints.js          # 移除积分 (P0)
│
├── 📂 refunds/                  # 退款
│   ├── applyRefund.js           # 申请退款 (P0)
│   ├── approveRefund.js         # 审批退款 (P0)
│   ├── rejectRefund.js          # 拒绝退款 (P0)
│   ├── processRefund.js         # 处理退款 (P0)
│   └── listRefundRecords.js     # 退款记录 (P1)
│
└── 📂 config/                   # 支付配置
    ├── getPaymentConfig.js      # 获取配置 (P1)
    └── updatePaymentConfig.js   # 更新配置 (P1)
```

### 3.4 退款规则

```
退款优先级 (从高到低):
1. 微信支付原路退回
2. 充值款退回钱包
3. 现金补充退回微信
4. 优惠券不退 (记录返还数量)
5. 积分不退 (记录返还数量)

退款公式:
应退金额 = 实付金额 - 已消费部分
退微信 = min(微信支付部分，应退金额)
退充值款 = 应退金额 - 退微信
```

---

## 📊 模块四：运营后台

### 4.1 数据库表设计

```sql
-- 数据统计表 (日报)
CREATE TABLE daily_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE UNIQUE NOT NULL,         -- 统计日期
  total_users INTEGER DEFAULT 0,          -- 总用户数
  new_users INTEGER DEFAULT 0,            -- 新增用户
  active_users INTEGER DEFAULT 0,         -- 活跃用户
  total_orders INTEGER DEFAULT 0,         -- 总订单数
  completed_orders INTEGER DEFAULT 0,     -- 完成订单
  total_revenue REAL DEFAULT 0,           -- 总收入
  total_payment REAL DEFAULT 0,           -- 总支付金额
  total_refund REAL DEFAULT 0,            -- 总退款
  total_coupons_issued INTEGER DEFAULT 0, -- 发放券数
  total_points_issued INTEGER DEFAULT 0,  -- 发放积分
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 运营活动表
CREATE TABLE operation_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_name TEXT NOT NULL,              -- 活动名称
  activity_type TEXT NOT NULL,              -- 类型：discount(折扣), coupon(券), points(积分), referral(拉新)
  description TEXT,
  banner_image TEXT,                        -- 横幅图片
  config_json TEXT,                         -- 活动配置 (JSON)
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  target_audience TEXT,                     -- 目标受众：all, new, old
  budget REAL,                              -- 预算
  used_budget REAL DEFAULT 0,               -- 已用预算
  status TEXT DEFAULT 'draft',              -- 状态：draft, active, paused, ended
  created_by INTEGER,                       -- 创建人 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 消息推送表
CREATE TABLE push_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                      -- 标题
  content TEXT NOT NULL,                    -- 内容
  type TEXT DEFAULT 'system',               -- 类型：system, activity, order, promotion
  target_audience TEXT,                     -- 目标受众：all, specific_users, user_group
  target_user_ids TEXT,                     -- 目标用户 ID 列表 (JSON)
  status TEXT DEFAULT 'draft',              -- 状态：draft, scheduled, sent, cancelled
  scheduled_at DATETIME,                    -- 计划发送时间
  sent_at DATETIME,                         -- 实际发送时间
  sent_count INTEGER DEFAULT 0,             -- 发送数量
  created_by INTEGER,                       -- 创建人 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 用户反馈表
CREATE TABLE user_feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  type TEXT NOT NULL,                       -- 类型：bug, suggestion, complaint, other
  title TEXT NOT NULL,                      -- 标题
  content TEXT NOT NULL,                    -- 内容
  images TEXT,                              -- 图片 (JSON)
  status TEXT DEFAULT 'pending',            -- 状态：pending, processing, resolved, ignored
  response TEXT,                            -- 官方回复
  responded_by INTEGER,                     -- 回复人 ID
  responded_at DATETIME,                    -- 回复时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (responded_by) REFERENCES users(id)
);
```

### 4.2 API Handlers

```
backend/api/handlers/operation/
├── 📂 dashboard/                # 数据看板
│   ├── getOverview.js           # 概览数据 (P0)
│   ├── getUserStats.js          # 用户统计 (P0)
│   ├── getOrderStats.js         # 订单统计 (P0)
│   ├── getRevenueStats.js       # 收入统计 (P0)
│   └── getTrendAnalysis.js      # 趋势分析 (P1)
│
├── 📂 activities/               # 活动管理
│   ├── listActivities.js        # 活动列表 (P0)
│   ├── createActivity.js        # 创建活动 (P0)
│   ├── updateActivity.js        # 更新活动 (P0)
│   ├── deleteActivity.js        # 删除活动 (P1)
│   ├── startActivity.js         # 启动活动 (P0)
│   └── stopActivity.js          # 停止活动 (P0)
│
├── 📂 notifications/            # 消息推送
│   ├── listNotifications.js     # 推送列表 (P0)
│   ├── createNotification.js    # 创建推送 (P0)
│   ├── sendNotification.js      # 发送推送 (P0)
│   └── cancelNotification.js    # 取消推送 (P1)
│
├── 📂 feedbacks/                # 用户反馈
│   ├── listFeedbacks.js         # 反馈列表 (P0)
│   ├── getFeedbackDetail.js     # 反馈详情 (P0)
│   ├── respondFeedback.js       # 回复反馈 (P0)
│   └── markFeedbackResolved.js  # 标记已解决 (P1)
│
└── 📂 reports/                  # 报表
    ├── generateDailyReport.js   # 生成日报 (P0)
    ├── generateWeeklyReport.js  # 生成周报 (P1)
    └── generateMonthlyReport.js # 生成月报 (P1)
```

---

## ⭐ 模块五：评价系统

### 5.1 数据库表设计

```sql
-- 订单评价表
CREATE TABLE order_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL,         -- 订单 ID
  user_id INTEGER NOT NULL,                 -- 评价用户 ID
  carrier_id INTEGER,                       -- 承运商 ID
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 评分 1-5
  content TEXT,                             -- 评价内容
  images TEXT,                              -- 评价图片 (JSON)
  is_anonymous BOOLEAN DEFAULT 0,           -- 是否匿名
  reply_content TEXT,                       -- 商家回复
  reply_at DATETIME,                        -- 回复时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (carrier_id) REFERENCES users(id)
);

-- 服务评分表 (聚合)
CREATE TABLE service_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,          -- 用户 ID (作为被评价方)
  total_ratings INTEGER DEFAULT 0,          -- 总评价数
  average_rating REAL DEFAULT 0.0,          -- 平均评分
  rating_distribution TEXT,                 -- 评分分布 (JSON: {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0})
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 信用分表
CREATE TABLE credit_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,          -- 用户 ID
  base_score INTEGER DEFAULT 100,           -- 基础分 100
  current_score INTEGER DEFAULT 100,        -- 当前分数
  score_history TEXT,                       -- 分数历史 (JSON)
  level TEXT DEFAULT 'normal',              -- 等级：excellent, good, normal, poor, blacklisted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 信用记录表
CREATE TABLE credit_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  type TEXT NOT NULL,                       -- 类型：reward(奖励), penalty(惩罚)
  score_change INTEGER NOT NULL,            -- 分数变化
  reason TEXT NOT NULL,                     -- 原因
  source_type TEXT,                         -- 来源：order(订单), violation(违规), activity(活动)
  source_id TEXT,                           -- 来源 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5.2 API Handlers

```
backend/api/handlers/review/
├── 📂 orders/                   # 订单评价
│   ├── createReview.js          # 创建评价 (P0)
│   ├── updateReview.js          # 更新评价 (P1)
│   ├── listOrderReviews.js      # 评价列表 (P0)
│   └── replyReview.js           # 回复评价 (P0)
│
├── 📂 ratings/                  # 评分
│   ├── getUserRating.js         # 获取用户评分 (P0)
│   ├── getCarrierRating.js      # 获取承运商评分 (P0)
│   └── calculateRating.js       # 计算评分 (P0)
│
└── 📂 credit/                   # 信用
    ├── getCreditScore.js        # 获取信用分 (P0)
    ├── listCreditRecords.js     # 信用记录 (P0)
    ├── addCreditRecord.js       # 添加记录 (P0)
    └── updateCreditLevel.js     # 更新等级 (P1)
```

---

## 🔔 模块六：消息中心

### 6.1 数据库表设计

```sql
-- 站内信表
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 接收用户 ID
  title TEXT NOT NULL,                      -- 标题
  content TEXT NOT NULL,                    -- 内容
  type TEXT DEFAULT 'system',               -- 类型：system, order, payment, activity
  is_read BOOLEAN DEFAULT 0,                -- 是否已读
  link_type TEXT,                           -- 链接类型：order, activity, coupon, none
  link_id TEXT,                             -- 链接 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 推送配置表
CREATE TABLE push_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- 用户 ID
  push_type TEXT NOT NULL,                  -- 推送类型：app, sms, email, wechat
  is_enabled BOOLEAN DEFAULT 1,             -- 是否启用
  config_json TEXT,                         -- 配置 (JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, push_type)
);
```

---

## 🛡️ 模块七：保险理赔

### 7.1 数据库表设计

```sql
-- 保险订单表
CREATE TABLE insurance_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL,         -- 关联订单 ID
  insurance_type TEXT NOT NULL,             -- 保险类型：cargo(货物), vehicle(车辆), liability(责任)
  insurance_company TEXT,                   -- 保险公司
  policy_no TEXT,                           -- 保单号
  premium REAL,                             -- 保费
  coverage_amount REAL,                     -- 保额
  status TEXT DEFAULT 'active',             -- 状态：active, expired, claimed, cancelled
  valid_start DATETIME,                     -- 生效时间
  valid_end DATETIME,                       -- 失效时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 理赔申请表
CREATE TABLE insurance_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insurance_id INTEGER NOT NULL,            -- 保险 ID
  user_id INTEGER NOT NULL,                 -- 申请人 ID
  claim_no TEXT UNIQUE NOT NULL,            -- 理赔单号
  incident_date DATETIME NOT NULL,          -- 出险日期
  incident_type TEXT NOT NULL,              -- 出险类型：damage(损坏), loss(丢失), accident(事故)
  description TEXT NOT NULL,                -- 事故描述
  images TEXT,                              -- 现场图片 (JSON)
  estimated_loss REAL,                      -- 预估损失
  claim_amount REAL,                        -- 申请金额
  status TEXT DEFAULT 'pending',            -- 状态：pending, reviewing, approved, rejected, paid
  reviewer_id INTEGER,                      -- 审核人 ID
  review_comment TEXT,                      -- 审核意见
  approved_amount REAL,                     -- 批准金额
  paid_at DATETIME,                         -- 赔付时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insurance_id) REFERENCES insurance_orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

---

## 📱 模块八：小程序增强

### 8.1 新增页面

```
wx-program/pages/
├── 📂 customer-service/         # 客服
│   ├── ticket-list/             # 工单列表
│   ├── ticket-detail/           # 工单详情
│   ├── chat/                    # 在线客服会话
│   └── remote-drive/            # 远程驾驶申请
│
├── 📂 marketing/                # 营销
│   ├── coupon-center/           # 优惠券中心
│   ├── points-mall/             # 积分商城
│   ├── recharge/                # 充值页面
│   └── referral/                # 推荐好友
│
├── 📂 payment/                  # 支付
│   ├── payment-method/          # 支付方式选择
│   ├── payment-result/          # 支付结果
│   └── refund-status/           # 退款进度
│
└── 📂 review/                   # 评价
    ├── order-review/            # 订单评价
    └── my-rating/               # 我的评分
```

---

## 📊 开发优先级与排期

### P0 必须功能 (2 周)

| 模块 | 功能 | 工时 (天) | 依赖 |
|------|------|-----------|------|
| 客服系统 | 工单创建/列表/详情 | 3 | - |
| 支付中心 | 混合支付逻辑 | 5 | 钱包 |
| 支付中心 | 退款管理 | 3 | 支付 |
| 营销中心 | 优惠券领取/使用 | 3 | - |
| 营销中心 | 积分系统 | 3 | - |
| 评价系统 | 订单评价 | 2 | - |

### P1 重要功能 (2 周)

| 模块 | 功能 | 工时 (天) | 依赖 |
|------|------|-----------|------|
| 客服系统 | 在线客服会话 | 4 | - |
| 客服系统 | 远程驾驶 | 5 | 车辆追踪 |
| 营销中心 | 充值优惠 | 2 | 支付 |
| 营销中心 | 拉新活动 | 3 | - |
| 运营后台 | 数据看板 | 4 | 统计 |
| 消息中心 | 站内信 | 2 | - |

### P2 可选功能 (2 周)

| 模块 | 功能 | 工时 (天) | 依赖 |
|------|------|-----------|------|
| 营销中心 | 任务系统 | 4 | - |
| 运营后台 | 活动管理 | 4 | - |
| 保险理赔 | 投保/理赔 | 5 | - |
| 评价系统 | 信用体系 | 3 | - |

---

## 🗄️ 数据库迁移脚本

```
backend/scripts/migrations/
├── 009_add_customer_service_tables.js    # 客服系统表
├── 010_add_marketing_tables.js           # 营销系统表
├── 011_add_payment_tables.js             # 支付系统表
├── 012_add_operation_tables.js           # 运营系统表
├── 013_add_review_tables.js              # 评价系统表
├── 014_add_notification_tables.js        # 消息系统表
├── 015_add_insurance_tables.js           # 保险系统表
└── 016_update_wallet_tables.js           # 钱包扩展表
```

---

## 📝 配置项新增

```javascript
// backend/config/index.js 新增
module.exports = {
  // ... 现有配置
  
  // 支付配置
  payment: {
    minCashRatio: 0.05,                   // 最低现金比例 5%
    wechatApiKey: process.env.WECHAT_API_KEY,
    wechatMchId: process.env.WECHAT_MCH_ID,
  },
  
  // 客服配置
  customerService: {
    workingHours: { start: '09:00', end: '21:00' },
    maxConcurrentSessions: 5,
    autoAssignEnabled: true,
  },
  
  // 营销配置
  marketing: {
    pointsPerYuan: 1,                     // 1 元=1 积分
    referralBonus: 100,                   // 推荐奖励 100 积分
    dailySigninBonus: 10,                 // 签到奖励 10 积分
  },
};
```

---

## ✅ 验收标准

### 功能完整性
- [ ] 所有 P0 功能已实现并测试通过
- [ ] 核心业务流程可完整跑通
- [ ] 数据库表结构完整，索引优化

### 支付安全
- [ ] 支付逻辑符合 95% 现金 + 充值款要求
- [ ] 退款逻辑正确，资金安全
- [ ] 对账功能正常

### 性能指标
- [ ] API 响应时间 < 500ms
- [ ] 并发支持 > 1000 QPS
- [ ] 数据库查询优化完成

### 用户体验
- [ ] 小程序页面流畅
- [ ] 支付流程顺畅
- [ ] 客服响应及时

---

**文档版本**: 1.0.0  
**创建时间**: 2026-02-21  
**下次更新**: 开发完成后更新实际进度
