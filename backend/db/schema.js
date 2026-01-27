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
      customer_id TEXT,
      carrier_id TEXT,
      tenant_id INTEGER,
      tracking_number TEXT UNIQUE NOT NULL,
      sender_info TEXT NOT NULL,
      receiver_info TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      quote_price REAL,
      quote_delivery_time TEXT,
      quote_remarks TEXT,
      quote_deadline TEXT,
      customer_phone TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
    );
  `
};

// 扩展表定义
const EXTENDED_TABLES = {
  user_sessions: `
    CREATE TABLE IF NOT EXISTS user_sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
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
    console.log('🔍 检查并添加缺失的列...');

    // 检查 users 表是否已有 roles 列
    const columns = await db.all(`
      PRAGMA table_info(users);
    `);

    const columnNames = columns.map(col => col.name);

    // 添加缺失的 roles 列
    if (!columnNames.includes('roles')) {
      await db.run('ALTER TABLE users ADD COLUMN roles TEXT;');
      console.log('✅ 已添加 users.roles 列');
    }
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