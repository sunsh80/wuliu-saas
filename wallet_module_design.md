# 物流系统钱包模块设计

## 1. 钱包模块概述

钱包模块负责管理平台、承运商和客户的资金流动，包括抽佣的收取、结算和分配。

## 2. 数据库表结构

### 2.1 wallets 表 - 钱包表
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

### 2.2 wallet_transactions 表 - 钱包交易记录表
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

### 2.3 settlements 表 - 结算记录表
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

## 3. 钱包相关API接口

### 3.1 钱包查询接口
```
GET /api/wallets/me - 获取当前用户钱包信息
GET /api/wallets/{owner_type}/{owner_id} - 获取指定用户钱包信息
GET /api/wallets/{wallet_id}/transactions - 获取钱包交易记录
```

### 3.2 钱包交易接口
```
POST /api/wallets/{wallet_id}/freeze - 冻结资金
POST /api/wallets/{wallet_id}/unfreeze - 解冻资金
POST /api/wallets/transfer - 钱包间转账
```

### 3.3 结算接口
```
POST /api/settlements/process - 处理订单结算
GET /api/settlements/{order_id} - 获取订单结算信息
GET /api/settlements/history - 获取结算历史
```

## 4. 钱包交易流程

### 4.1 订单结算流程
1. 客户支付订单金额 → 客户钱包冻结相应金额
2. 计算抽佣金额 → 根据抽佣规则计算平台抽佣
3. 扣除抽佣 → 从客户钱包划转抽佣金额到平台钱包
4. 支付承运商 → 从客户钱包划转净额到承运商钱包
5. 更新结算记录 → 记录结算详情

### 4.2 抽佣处理流程
1. 订单完成时触发结算
2. 查询订单抽佣规则
3. 计算抽佣金额
4. 执行钱包交易
5. 记录抽佣历史

## 5. 钱包API实现示例

### 5.1 订单结算API
```javascript
// backend/api/handlers/settlement/processSettlement.js
const { getDb } = require('../../../db/index.js');

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
        u.name as carrier_name, cu.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.carrier_id = u.id
      LEFT JOIN tenants cu ON o.customer_tenant_id = cu.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
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

## 6. 与抽佣模块的集成

### 6.1 抽佣计算后自动触发结算
- 订单状态变为'delivered'时自动计算抽佣
- 根据抽佣结果执行钱包交易
- 更新结算记录

### 6.2 钱包余额监控
- 实时监控平台钱包余额
- 设置最低余额预警
- 确保资金流动性

## 7. 安全考虑

### 7.1 交易安全
- 所有资金操作使用数据库事务
- 防止重复扣款
- 余额充足性检查

### 7.2 权限控制
- 钱包操作权限验证
- 敏感操作二次确认
- 操作日志记录

这个钱包模块为物流系统提供了完整的资金管理功能，与抽佣模块紧密集成，确保资金流动的安全性和准确性。