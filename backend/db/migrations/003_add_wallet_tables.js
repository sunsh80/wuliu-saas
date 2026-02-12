// backend/db/migrations/003_add_wallet_tables.js
const { getDb } = require('../index.js');

async function addWalletTables() {
  console.log('🔄 开始添加钱包相关表结构...');

  const db = getDb();

  try {
    // 1. 创建钱包表
    console.log('🔍 [STEP 1] Creating wallets table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
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
    `);
    console.log('✅ Wallets table created successfully');

    // 2. 创建钱包交易记录表
    console.log('🔍 [STEP 2] Creating wallet_transactions table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
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
    `);
    console.log('✅ Wallet transactions table created successfully');

    // 3. 创建结算记录表
    console.log('🔍 [STEP 3] Creating settlements table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settlements (
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
    `);
    console.log('✅ Settlements table created successfully');

    // 4. 为现有订单表添加钱包相关字段（如果不存在）
    console.log('🔍 [STEP 4] Checking and adding wallet-related fields to orders table...');
    
    // 检查字段是否已存在
    const columns = await db.all("PRAGMA table_info(orders)");
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('carrier_wallet_id')) {
      await db.run("ALTER TABLE orders ADD COLUMN carrier_wallet_id INTEGER");
      console.log('✅ Added carrier_wallet_id column to orders table');
    }
    
    if (!columnNames.includes('customer_wallet_id')) {
      await db.run("ALTER TABLE orders ADD COLUMN customer_wallet_id INTEGER");
      console.log('✅ Added customer_wallet_id column to orders table');
    }

    console.log('🎉 钱包相关表结构添加完成！');
    console.log('新增表:');
    console.log('  - wallets: 存储平台、承运商、客户的钱包信息');
    console.log('  - wallet_transactions: 记录所有钱包交易');
    console.log('  - settlements: 记录订单结算详情');
    console.log('修改表:');
    console.log('  - orders: 添加了钱包关联字段');

  } catch (error) {
    console.error('💥 [ADD WALLET TABLES ERROR]:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行迁移
if (require.main === module) {
  addWalletTables()
    .then(() => {
      console.log('数据库钱包表迁移完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库钱包表迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { addWalletTables };