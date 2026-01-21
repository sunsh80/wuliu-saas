// backend/db/index.js
const { DatabaseConnection, getDb: getWrappedDb, DB_PATH } = require('./connection');
const DatabaseSchema = require('./schema');
const models = require('./models');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.schema = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    console.log('🚀 开始初始化数据库...');
    this.connection = new DatabaseConnection();
    const db = await this.connection.connect();
    this.schema = new DatabaseSchema();
    await this.schema.initialize(db);
    this.initialized = true;
    console.log('✅ 数据库初始化完成');
    return this;
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
      this.initialized = false;
    }
  }

  getDb() {
    if (!this.initialized) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }
    return getWrappedDb();
  }

  getModel(name) {
    if (!models[name]) {
      throw new Error(`模型 ${name} 不存在`);
    }
    return models[name];
  }
}

let dbManagerInstance = null;

async function openDatabaseAndInitialize() {
  if (!dbManagerInstance) {
    dbManagerInstance = new DatabaseManager();
    await dbManagerInstance.initialize();
  }
  return dbManagerInstance;
}

function getDatabaseManager() {
  if (!dbManagerInstance) {
    throw new Error('数据库管理器未初始化');
  }
  return dbManagerInstance;
}

async function withDb(callback) {
  const manager = await openDatabaseAndInitialize();
  const db = manager.getDb();
  return callback(db);
}

// ================================
// 🔁 兼容层：从 index3.js 迁移的函数
// ================================

const bcrypt = require('bcryptjs');

// 获取原始数据库连接（用于 run/get/all）
function getRawDb() {
  const manager = getDatabaseManager();
  return manager.getDb(); // 返回 { run, get, all }
}

// --- 用户相关 ---
async function createUser(userData) {
  const db = getRawDb();
  const { username, email, password, password_hash, user_type, tenant_id, customer_id, name = '', role = 'user', type = 'user' } = userData;

  let finalPasswordHash;
  if (password_hash !== undefined) {
    finalPasswordHash = password_hash;
  } else if (password !== undefined) {
    finalPasswordHash = await bcrypt.hash(password, 10);
  } else {
    throw new Error('createUser: 必须提供 password 或 password_hash');
  }

  const result = await db.run(
    `INSERT INTO users (
      username, email, password_hash, user_type, tenant_id, customer_id,
      name, role, type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [username, email, finalPasswordHash, user_type, tenant_id, customer_id, name, role, type]
  );

  return {
    id: result.lastID,
    username,
    email,
    name,
    role,
    type,
    user_type,
    tenant_id,
    customer_id,
    is_active: 1,
    status: 'active',
    created_at: new Date().toISOString()
  };
}

async function findUserById(id) {
  const db = getRawDb();
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function findUserByUsername(username) {
  const db = getRawDb();
  return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

async function findUserByEmail(email) {
  const db = getRawDb();
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// --- 租户 (Tenants) 相关 ---
async function createTenant(tenantData) {
  const db = getRawDb();
  const { name, contact_person, contact_phone, email, password, password_hash, roles, address = '' } = tenantData;

  let finalPasswordHash;
  if (password_hash !== undefined) {
    finalPasswordHash = password_hash;
  } else if (password !== undefined) {
    finalPasswordHash = await bcrypt.hash(password, 10);
  } else {
    throw new Error('createTenant: 必须提供 password 或 password_hash');
  }

  const result = await db.run(
    `INSERT INTO tenants (
      name, contact_person, contact_phone, email, password_hash, roles, address,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [name, contact_person, contact_phone, email, finalPasswordHash, JSON.stringify(roles), address]
  );

  return {
    id: result.lastID,
    name,
    contact_person,
    contact_phone,
    email,
    roles,
    address,
    created_at: new Date().toISOString(),
    status: 'pending'
  };
}

async function findTenantById(id) {
  const db = getRawDb();
  return db.get('SELECT * FROM tenants WHERE id = ?', [id]);
}

async function findAllTenants() {
  const db = getRawDb();
  return db.all('SELECT * FROM tenants ORDER BY created_at DESC');
}

async function findPendingTenants() {
  const db = getRawDb();
  return db.all("SELECT * FROM tenants WHERE status = 'pending' ORDER BY created_at ASC");
}

async function updateTenantStatus(id, status, approved_at = null, rejected_at = null, rejection_notes = null) {
  const db = getRawDb();
  const result = await db.run(
    'UPDATE tenants SET status = ?, approved_at = ?, rejected_at = ?, rejection_notes = ? WHERE id = ?',
    [status, approved_at, rejected_at, rejection_notes, id]
  );
  return result.changes > 0;
}

async function deleteTenantById(id) {
  const db = getRawDb();
  const result = await db.run('DELETE FROM tenants WHERE id = ?', [id]);
  return result.changes > 0;
}

// ================================
// 导出所有内容
// ================================
module.exports = {
  // 管理类
  DatabaseManager,
  openDatabaseAndInitialize,
  getDatabaseManager,

  // 连接
  getDb: getWrappedDb,
  DB_PATH,

  // 模型（新方式）
  models,

  // 快捷方法
  withDb,

  // --- 兼容旧版 API（来自 index3.js）---
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