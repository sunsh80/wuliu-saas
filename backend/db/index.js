// backend/db/index.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs'); // 引入 bcryptjs 用于密码哈希
require('dotenv').config(); // 加载 .env

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');
let dbInstance = null;

/** ================== 数据库操作封装 ================== */
function getDb() {
  if (!dbInstance) {
    throw new Error('数据库未初始化，请先调用 openDatabaseAndInitialize()');
  }
  return {
    get: (sql, params = []) =>
      new Promise((resolve, reject) =>
        dbInstance.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
      ),
    all: (sql, params = []) =>
      new Promise((resolve, reject) =>
        dbInstance.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
      ),
    run: (sql, params = []) =>
      new Promise((resolve, reject) =>
        dbInstance.run(sql, params, function (err) {
          err ? reject(err) : resolve(this);
        })
      ),
    close: () =>
      new Promise((resolve, reject) =>
        dbInstance.close((err) => (err ? reject(err) : resolve()))
      ),
  };
}

/** ================== 表结构定义 ================== */
const TABLE_DEFINITIONS = {
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
      carrier_id TEXT,
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
  `,
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
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
      service_radius_km INTEGER, -- 服务半径
      capacity_kg REAL, -- 最大承重（公斤）
      capacity_m3 REAL, -- 最大体积（立方米）
      base_price_per_km REAL, -- 每公里基础价格
      avg_rating REAL DEFAULT 0.0, -- 平均评分
      approved_at DATETIME,
      rejected_at DATETIME,
      rejection_notes TEXT
    );
  `
};

/** ================== 初始化数据库表结构 ================== */
async function initializeDatabase(db) {
  console.log('开始初始化数据库表结构...');

  // 启用外键
  await new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // 创建所有表
  for (const [name, sql] of Object.entries(TABLE_DEFINITIONS)) {
    await new Promise((resolve, reject) => {
      db.run(sql, (err) => (err ? reject(err) : resolve()));
    });
    console.log(`✅ 表 ${name} 已初始化`);
  }

  // 插入默认 admin 组织和用户
  const defaultOrgId = 'admin_org_id_001';
  const defaultUserId = 'admin_user_id_001';
  const bcrypt = require('bcrypt'); // 确保 bcrypt 已引入
  const defaultPasswordHash = await bcrypt.hash('admin123', 10); // 动态生成 'admin123' 的哈希

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO organizations (id, name, type, status) VALUES (?, 'Logistics Admin', 'admin', 'active')`,
      [defaultOrgId],
      (err) => (err ? reject(err) : resolve())
    );
  });

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO users (
        id, username, email, name, role, type,
        organization_id, organization_name, organization_type,
        password_hash, user_type, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin_user', 1)`,
      [
        defaultUserId,
        'admin',
        'admin@example.com',
        'Administrator',
        'super_admin',
        'admin',
        defaultOrgId,
        'Logistics Admin',
        'admin',
        defaultPasswordHash
      ],
      (err) => (err ? reject(err) : resolve())
    );
  });

  console.log('✅ 默认管理员已就绪 (账号: admin / 密码: admin123)');
}

/** ================== 用户相关的查询方法 ================== */
async function createUser(userData) {
  const db = getDb();
  const { username, email, password, user_type, tenant_id, customer_id } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.run(
    'INSERT INTO users (username, email, password_hash, user_type, tenant_id, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, hashedPassword, user_type, tenant_id, customer_id]
  );
  return { id: result.lastID, ...userData, password_hash: hashedPassword };
}

async function findUserById(id) {
  const db = getDb();
  const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  return row;
}

async function findUserByUsername(username) {
  const db = getDb();
  const row = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  return row;
}

async function findUserByEmail(email) {
  const db = getDb();
  const row = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  return row;
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/** ================== 租户 (Tenants) 相关的查询方法 ================== */
async function createTenant(tenantData) {
  const db = getDb();
  const { name, contact_person, contact_phone, email, password_hash, roles, address } = tenantData;

  // ✅ 使用 db.run（你已封装为 Promise）
  // ✅ 7 个字段对应 7 个参数
  // ✅ roles 转为 JSON 字符串
  const result = await db.run(
    `INSERT INTO tenants (
      name, contact_person, contact_phone, email, password_hash, roles, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, contact_person, contact_phone, email, password_hash, JSON.stringify(roles), address]
  );

  return {
    id: result.lastID,
    name,
    contact_person,
    contact_phone,
    email,
    roles, // 注意：这里返回的是原始数组（如果你希望返回数组）
    address,
    created_at: new Date().toISOString(),
    status: 'pending'
  };
}

async function findTenantById(id) {
  const db = getDb();
  const row = await db.get('SELECT * FROM tenants WHERE id = ?', [id]);
  return row;
}

async function findAllTenants() {
  const db = getDb();
  const rows = await db.all('SELECT * FROM tenants ORDER BY created_at DESC');
  return rows;
}

async function findPendingTenants() {
  const db = getDb();
  const rows = await db.all("SELECT * FROM tenants WHERE status = 'pending' ORDER BY created_at ASC");
  return rows;
}

async function updateTenantStatus(id, status, approved_at = null, rejected_at = null, rejection_notes = null) {
  const db = getDb();
  const result = await db.run(
    'UPDATE tenants SET status = ?, approved_at = ?, rejected_at = ?, rejection_notes = ? WHERE id = ?',
    [status, approved_at, rejected_at, rejection_notes, id]
  );
  return result.changes > 0;
}

async function deleteTenantById(id) {
  const db = getDb();
  const result = await db.run('DELETE FROM tenants WHERE id = ?', [id]);
  return result.changes > 0;
}

/** ================== 公共接口 ================== */
async function openDatabaseAndInitialize() {
  console.log('正在连接数据库:', DB_PATH);
  dbInstance = new sqlite3.Database(DB_PATH, (err) => {
    if (err) throw err;
    console.log('✅ 数据库连接成功!');
  });
  await initializeDatabase(dbInstance);
  console.log('✅ 数据库初始化完成。');
}

// 导出所有方法
module.exports = {
  openDatabaseAndInitialize,
  getDb,
  // 用户相关
  createUser,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  validatePassword,
  // 租户相关
  createTenant,
  findTenantById,
  findAllTenants,
  findPendingTenants,
  updateTenantStatus,
  deleteTenantById
};