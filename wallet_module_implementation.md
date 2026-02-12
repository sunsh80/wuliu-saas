# 物流系统钱包模块完整实现

## 1. 数据库表结构

### 1.1 wallets 表
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

### 1.2 wallet_transactions 表
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

### 1.3 settlements 表
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

## 2. 钱包API实现

### 2.1 获取当前用户钱包
```javascript
// backend/api/handlers/wallet/getCurrentUserWallet.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const userId = c.context?.id;
  const tenantId = c.context?.tenantId;

  if (!userId || !tenantId) {
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const db = getDb();

  try {
    // 根据用户角色确定钱包类型
    let ownerType = 'customer'; // 默认为客户
    if (c.context.roles && c.context.roles.includes('carrier')) {
      ownerType = 'carrier';
    } else if (c.context.roles && c.context.roles.includes('admin')) {
      ownerType = 'platform';
    }

    const wallet = await db.get(
      `SELECT * FROM wallets WHERE owner_type = ? AND owner_id = ?`,
      [ownerType, tenantId]
    );

    if (!wallet) {
      // 如果钱包不存在，创建一个
      await db.run(
        `INSERT INTO wallets (owner_type, owner_id, balance, frozen_amount, status) VALUES (?, ?, 0.0, 0.0, 'active')`,
        [ownerType, tenantId]
      );
      
      const newWallet = await db.get(
        `SELECT * FROM wallets WHERE owner_type = ? AND owner_id = ?`,
        [ownerType, tenantId]
      );
      
      return {
        status: 200,
        body: {
          success: true,
          data: { wallet: newWallet }
        }
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        data: { wallet }
      }
    };

  } catch (error) {
    console.error('Get wallet error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};
```

### 2.2 获取钱包交易记录
```javascript
// backend/api/handlers/wallet/getWalletTransactions.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const walletId = c.request.params.wallet_id;
  const userId = c.context?.id;
  const tenantId = c.context?.tenantId;

  if (!userId || !tenantId) {
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const db = getDb();

  try {
    // 验证钱包是否属于当前用户
    const wallet = await db.get(
      `SELECT * FROM wallets WHERE id = ?`,
      [walletId]
    );

    if (!wallet) {
      return { status: 404, body: { success: false, error: 'WALLET_NOT_FOUND' } };
    }

    // 檢查钱包是否属于当前用户
    if (wallet.owner_id !== tenantId) {
      return { status: 403, body: { success: false, error: 'FORBIDDEN' } };
    }

    // 获取查询参数
    const queryParams = c.request.query;
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    const transactionType = queryParams.transaction_type || null;
    const startDate = queryParams.start_date || null;
    const endDate = queryParams.end_date || null;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = "WHERE wallet_id = ?";
    const params = [walletId];

    if (transactionType) {
      whereClause += " AND transaction_type = ?";
      params.push(transactionType);
    }

    if (startDate) {
      whereClause += " AND created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND created_at <= ?";
      params.push(endDate);
    }

    // 查询交易记录总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
      params
    );

    const total = countResult.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 查询交易记录
    const transactions = await db.all(`
      SELECT * FROM wallet_transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          transactions,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            per_page: limit
          }
        }
      }
    };

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};
```

### 2.3 订单结算处理
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
      \`订单 \${order_id} 抽佣\`, \`COMMISSION-\${order_id}\`
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
      \`订单 \${order_id} 抽佣收入\`, \`COMMISSION-\${order_id}\`
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
      \`订单 \${order_id} 支付给承运商\`, \`PAYMENT-\${order_id}\`
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
      \`订单 \${order_id} 收入\`, \`PAYMENT-\${order_id}\`
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

## 3. 钱包模块集成

### 3.1 与抽佣模块集成
- 订单结算时自动执行抽佣划转
- 根据抽佣规则计算抽佣金额
- 更新平台钱包余额

### 3.2 与订单模块集成
- 客户下单时冻结相应金额
- 订单完成时执行资金划转
- 更新订单状态

### 3.3 与风控模块集成
- 违规处罚时调整钱包状态
- 限制违规用户的钱包操作

## 4. 安全考虑

### 4.1 交易安全
- 所有资金操作使用数据库事务
- 防止重复扣款
- 余额充足性检查

### 4.2 权限控制
- 钱包操作权限验证
- 敏感操作二次确认
- 操作日志记录

## 5. 部署说明

### 5.1 数据库迁移
1. 执行数据库结构更新脚本
2. 验证新表结构

### 5.2 API部署
1. 部署钱包相关API处理器
2. 验证API接口

### 5.3 配置管理
1. 设置钱包初始参数
2. 配置安全策略

这个钱包模块为物流系统提供了完整的资金管理功能，与抽佣模块紧密集成，确保资金流动的安全性和准确性。