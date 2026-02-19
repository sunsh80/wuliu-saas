# 钱包与抽佣管理系统

## 概述

本平台采用**净额法**进行财务结算，确保平台仅收取抽佣费用，客户支付的钱款通过第三方银行或微信进行结算，直接扣除给承运商，避免财务风险。

### 核心设计理念

1. **净额法结算**：平台不触碰客户资金，仅通过钱包系统记录抽佣
2. **钱包隔离**：平台、承运商、客户各自拥有独立钱包
3. **交易可追溯**：所有资金流动都有详细的交易记录
4. **实时结算**：订单完成后自动执行结算流程

---

## 数据库表结构

### 1. wallets - 钱包表

```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('platform', 'carrier', 'customer')),
  owner_id INTEGER NOT NULL,
  balance REAL NOT NULL DEFAULT 0.0,
  frozen_amount REAL NOT NULL DEFAULT 0.0,
  available_balance REAL GENERATED ALWAYS AS (balance - frozen_amount) STORED,
  currency TEXT DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**字段说明：**
- `owner_type`: 钱包拥有者类型（platform/carrier/customer）
- `owner_id`: 拥有者 ID（对应 tenants.id 或 users.id）
- `balance`: 总余额
- `frozen_amount`: 冻结金额
- `available_balance`: 可用余额（计算字段）
- `status`: 钱包状态（active/frozen/closed）

---

### 2. wallet_transactions - 钱包交易记录表

```sql
CREATE TABLE wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  order_id INTEGER,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'freeze', 'unfreeze', 'transfer')),
  amount REAL NOT NULL,
  balance_change REAL NOT NULL,
  description TEXT,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);
```

**交易类型：**
- `income`: 收入
- `expense`: 支出
- `freeze`: 冻结
- `unfreeze`: 解冻
- `transfer`: 转账

---

### 3. settlements - 结算记录表

```sql
CREATE TABLE settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  carrier_wallet_id INTEGER NOT NULL,
  platform_wallet_id INTEGER NOT NULL,
  gross_amount REAL NOT NULL,          -- 订单总金额
  commission_amount REAL NOT NULL,     -- 抽佣金额
  net_amount REAL NOT NULL,            -- 承运商净收入
  settlement_status TEXT NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processing', 'completed', 'failed')),
  commission_transaction_id INTEGER,
  payment_transaction_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (commission_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL
);
```

**结算流程：**
1. `gross_amount` = 订单总金额（客户需支付）
2. `commission_amount` = 平台抽佣金额
3. `net_amount` = gross_amount - commission_amount（承运商实际收入）

---

### 4. commission_configs - 抽佣配置表

```sql
CREATE TABLE commission_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT DEFAULT '默认规则',
  platform_rate REAL NOT NULL DEFAULT 0.05,        -- 平台抽佣比例 5%
  carrier_rate REAL NOT NULL DEFAULT 0.03,         -- 承运商抽佣比例 3%
  base_commission_percent REAL NOT NULL DEFAULT 10.0,  -- 基础抽佣比例
  min_commission_percent REAL NOT NULL DEFAULT 0.0,    -- 最低抽佣比例
  max_commission_percent REAL NOT NULL DEFAULT 50.0,   -- 最高抽佣比例
  min_amount REAL NOT NULL DEFAULT 0.5,            -- 最低抽佣金额
  max_amount REAL NOT NULL DEFAULT 50.0,           -- 最高抽佣金额
  effective_date TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5. commission_history - 抽佣历史记录表

```sql
CREATE TABLE commission_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  vehicle_id INTEGER,
  base_commission_percent REAL NOT NULL DEFAULT 10.0,
  override_commission_percent REAL,
  final_commission_percent REAL NOT NULL,
  calculated_amount REAL NOT NULL,
  applied_rule_id INTEGER,
  adjustment_reason TEXT,
  processed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (applied_rule_id) REFERENCES commission_configs(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

**索引：**
- `idx_commission_history_order`: 加速按订单查询
- `idx_commission_history_vehicle`: 加速按车辆查询

---

## API 接口

### 钱包相关 API

#### 1. 获取当前用户钱包
```
GET /api/wallet/current
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "wallet": {
      "id": 1,
      "owner_type": "carrier",
      "owner_id": 2,
      "balance": 1000.00,
      "frozen_amount": 0.00,
      "available_balance": 1000.00,
      "currency": "CNY",
      "status": "active"
    }
  }
}
```

#### 2. 获取钱包交易记录
```
GET /api/wallet/{wallet_id}/transactions
Authorization: Bearer <token>

Query Parameters:
- page: 页码（默认 1）
- limit: 每页数量（默认 10）
- type: 交易类型筛选

Response:
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

---

### 结算相关 API

#### 1. 处理订单结算
```
POST /api/settlement/process/:order_id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "force_settle": false  // 是否强制结算
}

Response:
{
  "success": true,
  "message": "Settlement completed successfully",
  "data": {
    "order_id": 1,
    "gross_amount": 200.00,      // 订单总金额
    "commission_amount": 20.00,  // 平台抽佣
    "net_amount": 180.00,        // 承运商净收入
    "order_status": "completed",
    "wallets": {
      "customer": { "id": 3, "balance": 800.00 },
      "carrier": { "id": 2, "balance": 1180.00 },
      "platform": { "id": 1, "balance": 20.00 }
    },
    "transactions": {
      "commission": { "id": 1, "wallet_id": 3, "amount": -20.00 },
      "platform_income": { "id": 2, "wallet_id": 1, "amount": 20.00 },
      "payment": { "id": 3, "wallet_id": 3, "amount": -180.00 },
      "carrier_income": { "id": 4, "wallet_id": 2, "amount": 180.00 }
    }
  }
}
```

#### 2. 获取订单结算状态
```
GET /api/settlement/orders/{order_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "order_id": 1,
    "settlement_status": "completed",
    "gross_amount": 200.00,
    "commission_amount": 20.00,
    "net_amount": 180.00,
    "processed_at": "2026-02-19T10:30:00Z"
  }
}
```

#### 3. 获取结算汇总
```
GET /api/settlement/summary
Authorization: Bearer <token>

Query Parameters:
- start_date: 开始日期
- end_date: 结束日期

Response:
{
  "success": true,
  "data": {
    "total_orders": 100,
    "total_gross_amount": 20000.00,
    "total_commission": 2000.00,
    "total_net_amount": 18000.00,
    "pending_settlements": 5,
    "completed_settlements": 95
  }
}
```

---

### 抽佣管理 API

#### 1. 获取抽佣配置
```
GET /api/admin/commissions/config
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "config": {
      "id": 1,
      "rule_name": "默认规则",
      "platform_rate": 0.05,
      "carrier_rate": 0.03,
      "base_commission_percent": 10.0,
      "min_commission_percent": 0.0,
      "max_commission_percent": 50.0,
      "min_amount": 0.5,
      "max_amount": 50.0,
      "is_active": true
    }
  }
}
```

#### 2. 更新抽佣配置
```
PUT /api/admin/commissions/config
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "platform_rate": 0.06,
  "carrier_rate": 0.04,
  "base_commission_percent": 12.0,
  "notes": "调整抽佣比例"
}
```

#### 3. 获取抽佣记录列表
```
GET /api/admin/commissions/records
Authorization: Bearer <token>

Query Parameters:
- page: 页码
- limit: 每页数量
- status: 状态筛选（pending/completed/failed）
- start_date: 开始日期
- end_date: 结束日期

Response:
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "order_id": 1001,
        "order_amount": 200.00,
        "platform_commission": 10.00,
        "carrier_commission": 6.00,
        "status": "completed",
        "created_at": "2026-02-19T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### 4. 计算订单抽佣
```
POST /api/admin/commission/calculate/:order_id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "tracking_number": "ORD-20260219-001",
      "amount": 200.00
    },
    "calculation_breakdown": {
      "base_commission_percent": 10.0,
      "override_commission_percent": null,
      "penalty_commission_percent": 0,
      "final_commission_percent": 10.0,
      "commission_amount": 20.00
    }
  }
}
```

---

## 结算流程

### 完整结算时序图

```
客户 (Customer)          平台 (Platform)          承运商 (Carrier)
    |                        |                        |
    |--- 支付订单金额 ------->|                        |
    |    (gross_amount)      |                        |
    |                        |                        |
    |                        |--- 计算抽佣 ---------->|
    |                        |    (commission)        |
    |                        |                        |
    |                        |--- 净额结算 ---------->|
    |                        |    (net_amount)        |
    |                        |                        |
    | 余额减少               | 余额增加               | 余额增加
    | -gross_amount          | +commission            | +net_amount
    |                        |                        |
```

### 结算步骤详解

**步骤 1：验证订单状态**
- 订单必须处于 `awarded`、`dispatched`、`in_transit` 或 `delivered` 状态
- 检查是否已有结算记录

**步骤 2：计算抽佣金额**
```javascript
// 从 commission_history 获取计算的抽佣
const commissionCalculation = await db.get(`
  SELECT final_commission_percent, calculated_amount as commission_amount
  FROM commission_history
  WHERE order_id = ?
  ORDER BY created_at DESC
  LIMIT 1
`, [order_id]);
```

**步骤 3：确保钱包存在**
```javascript
// 如果钱包不存在则创建
await db.run(`
  INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
  VALUES ('platform', 1, 0.0, 0.0, 'active')
`);
```

**步骤 4：检查客户余额**
```javascript
if (customerWallet.available_balance < grossAmount) {
  // 余额不足，拒绝结算
  return { error: 'INSUFFICIENT_FUNDS' };
}
```

**步骤 5：执行抽佣交易（客户 → 平台）**
```javascript
// 客户钱包扣款
await db.run(`
  UPDATE wallets SET balance = balance - ? WHERE id = ?
`, [commissionAmount, customerWallet.id]);

// 平台钱包收款
await db.run(`
  UPDATE wallets SET balance = balance + ? WHERE id = ?
`, [commissionAmount, platformWallet.id]);
```

**步骤 6：执行支付交易（客户 → 承运商）**
```javascript
// 客户钱包扣款（净额）
await db.run(`
  UPDATE wallets SET balance = balance - ? WHERE id = ?
`, [netAmount, customerWallet.id]);

// 承运商钱包收款
await db.run(`
  UPDATE wallets SET balance = balance + ? WHERE id = ?
`, [netAmount, carrierWallet.id]);
```

**步骤 7：记录交易流水**
```javascript
// 插入 wallet_transactions 记录
await db.run(`
  INSERT INTO wallet_transactions (...)
  VALUES (...)
`, [...]);
```

**步骤 8：更新订单状态**
```javascript
await db.run(`
  UPDATE orders SET status = 'completed', updated_at = datetime('now')
  WHERE id = ?
`, [order_id]);
```

---

## 前端管理页面

### 管理平台 - 抽佣管理页面

位置：`web/admin-web/public/commissions.html`

**功能模块：**

1. **抽佣规则配置**
   - 平台抽佣比例设置
   - 承运商抽佣比例设置
   - 最低/最高抽佣金额设置

2. **分级抽佣配置**
   - 按订单金额分级设置不同抽佣比例
   - 支持添加/删除分级规则

3. **抽佣历史记录**
   - 查看所有订单的抽佣记录
   - 筛选查询（按订单号、日期、状态）
   - 导出功能

4. **统计数据**
   - 总订单数
   - 总抽佣金额
   - 待结算/已结算统计

---

## 财务安全保障

### 1. 资金隔离
- 平台钱包与客户、承运商钱包完全隔离
- 平台仅能收取约定的抽佣费用
- 客户资金直接进入承运商钱包（扣除抽佣后）

### 2. 交易可追溯
- 所有交易都有详细的流水记录
- 每笔结算都有对应的交易 ID
- 支持审计和追溯

### 3. 风险控制
- 钱包余额不足时拒绝结算
- 事务处理确保数据一致性
- 异常回滚机制

### 4. 合规性
- 符合净额法会计处理原则
- 避免平台挪用客户资金风险
- 降低金融监管风险

---

## 第三方集成

### 银行/微信支付集成

```
客户支付 -----> 第三方支付渠道 -----> 承运商账户
                    |
                    |-----> 平台抽佣账户
```

**集成流程：**

1. **客户支付**
   - 客户通过微信/支付宝/银行卡支付订单金额
   - 资金进入第三方支付托管账户

2. **分账处理**
   - 第三方根据平台指令进行分账
   - 抽佣部分转入平台账户
   - 净额部分转入承运商账户

3. **钱包同步**
   - 平台钱包系统同步更新余额
   - 记录交易流水

**推荐第三方服务：**
- 微信支付分账
- 支付宝分账
- 银行存管系统

---

## 迁移脚本

已创建的迁移脚本：

1. `002_add_management_tables.js` - 创建 commission_configs, commission_tiers, commission_records
2. `003_add_wallet_tables.js` - 创建 wallets, wallet_transactions, settlements
3. `009_add_commission_history_table.js` - 创建 commission_history
4. `010_add_commission_configs_table.js` - 创建 commission_configs 并插入默认配置

**执行迁移：**
```bash
node backend/db/migrations/009_add_commission_history_table.js
node backend/db/migrations/010_add_commission_configs_table.js
```

---

## 测试数据

### 创建测试钱包
```sql
-- 平台钱包
INSERT INTO wallets (owner_type, owner_id, balance, status)
VALUES ('platform', 1, 0.0, 'active');

-- 承运商钱包（假设 carrier_id=2）
INSERT INTO wallets (owner_type, owner_id, balance, status)
VALUES ('carrier', 2, 0.0, 'active');

-- 客户钱包（假设 customer_id=1）
INSERT INTO wallets (owner_type, owner_id, balance, status)
VALUES ('customer', 1, 1000.0, 'active');
```

### 测试结算流程
```bash
# 使用 Postman 或 curl 测试
curl -X POST http://localhost:3000/api/settlement/process/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"force_settle": true}'
```

---

## 常见问题

### Q1: 钱包余额不足怎么办？
A: 结算前会检查客户钱包余额，如果不足则拒绝结算。需要客户先充值。

### Q2: 结算失败如何处理？
A: 结算过程使用事务处理，任何步骤失败都会回滚，确保数据一致性。

### Q3: 如何调整抽佣比例？
A: 通过管理平台的抽佣管理页面调整，或调用 API 更新 commission_configs 表。

### Q4: 是否支持部分结算？
A: 当前版本不支持，订单要么全额结算，要么不结算。

### Q5: 如何查看历史交易记录？
A: 调用 GET /api/wallet/{wallet_id}/transactions 接口查询。

---

## 后续优化

1. **自动充值**：集成第三方支付，支持自动充值
2. **提现功能**：承运商可将钱包余额提现到银行卡
3. **信用额度**：为优质客户提供信用额度，允许透支
4. **分账系统**：直接对接微信/支付宝分账 API
5. **财务报表**：生成财务报表，支持导出 Excel
6. **对账功能**：与第三方支付渠道对账

---

## 相关文件

- 后端 Handler:
  - `backend/api/handlers/wallet/getCurrentUserWallet.js`
  - `backend/api/handlers/wallet/getWalletTransactions.js`
  - `backend/api/handlers/settlement/processSettlement.js`

- 数据库模型:
  - `backend/db/models/Commission.js`

- 前端页面:
  - `web/admin-web/public/commissions.html`
  - `web/tenant-web/public/commissions.html`

- 迁移脚本:
  - `backend/db/migrations/002_add_management_tables.js`
  - `backend/db/migrations/003_add_wallet_tables.js`
  - `backend/db/migrations/009_add_commission_history_table.js`
  - `backend/db/migrations/010_add_commission_configs_table.js`

- API 文档:
  - `backend/openapi.yaml` (搜索 /api/wallet, /api/settlement, /api/commission)
