// backend/db/schema.js
const bcrypt = require('bcryptjs');

// 核心表定义
const CORE_TABLES = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      roles TEXT,
      type TEXT NOT NULL,
      organization_id TEXT,
      organization_name TEXT,
      organization_type TEXT,
      password_hash TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK (user_type IN ('tenant_user', 'user', 'admin_user')),
      tenant_id INTEGER,
      customer_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
    );
  `,
  tenants: `
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      roles TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      service_radius_km INTEGER,
      capacity_kg REAL,
      capacity_m3 REAL,
      base_price_per_km REAL,
      avg_rating REAL DEFAULT 0.0,
      approved_at DATETIME,
      rejected_at DATETIME,
      rejection_notes TEXT
    );
  `,
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  customer_applications: `
    CREATE TABLE IF NOT EXISTS customer_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  orders: `
      CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_tenant_id INTEGER NOT NULL, -- 添加此行，引用 tenants.id
      carrier_id TEXT,
      tenant_id INTEGER,
      tracking_number TEXT UNIQUE NOT NULL,
      sender_info TEXT NOT NULL,
      receiver_info TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','pending_claim', 'claimed', 'quoted', 'awarded', 'dispatched', 'in_transit', 'delivered', 'cancelled')),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      quote_price REAL,
      quote_delivery_time TEXT,
      quote_remarks TEXT,
      quote_deadline TEXT,
      customer_phone TEXT,
      weight_kg REAL,
      volume_m3 REAL,
      required_delivery_time TEXT,
      description TEXT,
      type_user INTEGER DEFAULT NULL,
      FOREIGN KEY (customer_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );
  `,
tenant_vehicles: ` CREATE TABLE IF NOT EXISTS tenant_vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL, -- 引用 tenants 表
  plate_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  length REAL,
  width REAL,
  height REAL,
  max_weight REAL,
  volume REAL,
  status TEXT DEFAULT 'active',
  driver_name TEXT,
  driver_phone TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE -- 正确的外键约束
); 
`,
};

// 扩展表定义
const EXTENDED_TABLES = {
user_sessions: `CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  // --- NEW TABLE: quotes ---
  quotes: `CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,           -- 关联订单ID
    carrier_id INTEGER NOT NULL,         -- 关联承运商ID (来自 users 表)
    quote_price REAL NOT NULL,           -- 报价金额
    quote_delivery_time TEXT NOT NULL,   -- 预计送达时间
    quote_remarks TEXT,                  -- 报价备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(order_id, carrier_id)         -- 一个承运商对一个订单只能报价一次
  )`,
  organizations: `
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('tenant', 'admin')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')) DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `
};

class DatabaseSchema {
  constructor() {
    this.tables = { ...CORE_TABLES, ...EXTENDED_TABLES };
  }

  async initialize(db) {
    console.log('🔨 开始初始化数据库表结构...');
    try {
      await db.run('PRAGMA foreign_keys = ON;');
      console.log('✅ 外键约束已启用');

      for (const [tableName, sql] of Object.entries(this.tables)) {
        try {
          await db.exec(sql);
          console.log(`✅ 表 ${tableName} 已初始化`);
        } catch (error) {
          console.error(`❌ 创建表 ${tableName} 失败:`, error.message);
          throw error;
        }
      }

      // 检查并添加缺失的列
      await this.ensureColumnsExist(db);

      await this.createDefaultAdmin(db);
      console.log('🎉 数据库表结构初始化完成');
      return true;
    } catch (error) {
      console.error('💥 数据库初始化失败:', error);
      throw error;
    }
  }

async ensureColumnsExist(db) {
    // Check for users.roles column
    const userRolesCheck = await db.all("PRAGMA table_info(users);");
    if (!userRolesCheck.some(col => col.name === 'roles')) {
        await db.exec("ALTER TABLE users ADD COLUMN roles TEXT;");
    }

    // Check for orders.type_user column
    const orderTypeUserCheck = await db.all("PRAGMA table_info(orders);");
    if (!orderTypeUserCheck.some(col => col.name === 'type_user')) {
        await db.exec("ALTER TABLE orders ADD COLUMN type_user INTEGER DEFAULT NULL;");
    }
    // Add checks for other missing columns here as needed
}

  async createDefaultAdmin(db) {
    const defaultOrgId = 'admin_org_id_001';
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);

    const orgExists = await db.get('SELECT id FROM organizations WHERE id = ?', [defaultOrgId]);
    if (!orgExists) {
      await db.run(
        `INSERT INTO organizations (id, name, type, status) VALUES (?, 'Logistics Admin', 'admin', 'active')`,
        [defaultOrgId]
      );
      console.log('✅ 默认组织已创建');
    }

    const adminExists = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      await db.run(
        `INSERT INTO users (
          username, email, phone, name, role, roles, type, organization_id, organization_name,
          organization_type, password_hash, user_type, is_active, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'admin',
          'admin@example.com',
          '13800138000',  // 添加默认电话号码
          'Administrator',
          'super_admin',
          JSON.stringify(['super_admin']),
          'admin',
          defaultOrgId,
          'Logistics Admin',
          'admin',
          defaultPasswordHash,
          'admin_user',
          1,
          'active'
        ]
      );
      console.log('✅ 默认管理员已创建 (账号: admin / 密码: admin123)');
    }
  }

  getTableDefinition(tableName) {
    return this.tables[tableName];
  }

  getTableNames() {
    return Object.keys(this.tables);
  }
}

module.exports = DatabaseSchema;