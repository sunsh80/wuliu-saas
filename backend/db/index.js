// db/index.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // 加载 .env

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');
let dbInstance = null;

/** 初始化数据库表结构 */
async function initializeDatabase(db) {
  console.log('开始初始化数据库表结构...');

  // --- 客户相关表 ---
  const customerTables = {
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
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        tracking_number TEXT UNIQUE NOT NULL,
        sender_info TEXT NOT NULL,
        receiver_info TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
      );
    `,
    user_sessions: `
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `
  };

  // --- 总后台相关表 ---
  const adminTables = {
    organizations: `
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('tenant', 'admin')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')) DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE NOT NULL DEFAULT '13800000000',
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'viewer', 'super_admin', 'tenant_approver', 'order_viewer')),
        type TEXT NOT NULL CHECK (type IN ('app', 'tenant', 'admin')),
        organization_id TEXT,
        organization_name TEXT,
        organization_type TEXT CHECK (organization_type IN ('tenant', 'admin')),
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL
      );
    `,
    tenants: `
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        contact_phone TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')) DEFAULT 'pending',
        business_license_path TEXT,
        legal_id_front_path TEXT,
        legal_id_back_path TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `
  };

  // 启用外键
  await new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // 创建客户表
  for (const [name, sql] of Object.entries(customerTables)) {
    await new Promise((resolve, reject) => {
      db.run(sql, (err) => (err ? reject(err) : resolve()));
    });
    console.log(`✅ 客户表 ${name} 已初始化`);
  }

  // 创建后台表
  for (const [name, sql] of Object.entries(adminTables)) {
    await new Promise((resolve, reject) => {
      db.run(sql, (err) => (err ? reject(err) : resolve()));
    });
    console.log(`✅ 后台表 ${name} 已初始化`);
  }

  // 插入默认 admin 组织和用户
  const defaultOrgId = 'admin_org_id_001';
  const defaultUserId = 'admin_user_id_001';
  const defaultPasswordHash = '$2b$10$9boPY1MoDy5QVdzitw/m.e.YO0bBRUKy2dJ9Xj/qY47Onra6xH2G'; // 'admin123'

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO organizations (id, name, type, status) VALUES (?, 'Logistics Admin', 'admin', 'active')`,
      [defaultOrgId],
      (err) => (err ? reject(err) : resolve())
    );
  });

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO users (id, username, phone, name, role, type, organization_id, organization_name, organization_type, password_hash)
       VALUES (?, 'admin', '13800138000', 'Administrator', 'super_admin', 'admin', ?, 'Logistics Admin', 'admin', ?)`,
      [defaultUserId, defaultOrgId, defaultPasswordHash],
      (err) => (err ? reject(err) : resolve())
    );
  });

  console.log('✅ 默认管理员已就绪 (账号: admin / 密码: admin123)');
}

/** 打开数据库并初始化 */
async function openDatabaseAndInitialize() {
  console.log('正在连接数据库:', DB_PATH);
  dbInstance = new sqlite3.Database(DB_PATH, (err) => {
    if (err) throw err;
    console.log('✅ 数据库连接成功!');
  });
  await initializeDatabase(dbInstance);
  console.log('✅ 数据库初始化完成。');
}

/** 获取数据库操作接口 */
function getDb() {
  if (!dbInstance) {
    throw new Error('数据库未初始化，请先调用 openDatabaseAndInitialize()');
  }
  return {
    get: (sql, params = []) => new Promise((resolve, reject) => dbInstance.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))),
    all: (sql, params = []) => new Promise((resolve, reject) => dbInstance.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))),
    run: (sql, params = []) => new Promise((resolve, reject) => dbInstance.run(sql, params, function (err) { (err ? reject(err) : resolve(this)); })),
    close: () => new Promise((resolve, reject) => dbInstance.close((err) => (err ? reject(err) : resolve()))),
  };
}

module.exports = { openDatabaseAndInitialize, getDb };