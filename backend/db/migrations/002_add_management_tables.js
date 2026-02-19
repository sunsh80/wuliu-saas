// backend/db/migrations/002_add_management_tables.js
/**
 * 添加管理相关的数据表：
 * - violations: 违规记录表
 * - commission_configs: 抽佣配置表
 * - commission_tiers: 分级抽佣表
 * - commission_records: 抽佣记录表
 * - system_settings: 系统设置表
 * - vehicle_positions: 车辆位置追踪表
 */

const { getDb } = require('../connection');

async function up() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    db.exec(`
      -- 违规记录表
      CREATE TABLE IF NOT EXISTS violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER,
        tenant_name TEXT NOT NULL,
        violation_type TEXT NOT NULL,
        description TEXT NOT NULL,
        violation_date TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'cancelled')),
        handler_id INTEGER,
        handle_notes TEXT,
        handle_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- 抽佣配置表
      CREATE TABLE IF NOT EXISTS commission_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform_rate REAL NOT NULL DEFAULT 0.05,
        carrier_rate REAL NOT NULL DEFAULT 0.03,
        min_amount REAL NOT NULL DEFAULT 0.5,
        max_amount REAL NOT NULL DEFAULT 50.0,
        effective_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- 分级抽佣表
      CREATE TABLE IF NOT EXISTS commission_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER NOT NULL,
        min_amount REAL NOT NULL,
        max_amount REAL,
        platform_rate REAL NOT NULL,
        carrier_rate REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (config_id) REFERENCES commission_configs(id) ON DELETE CASCADE
      );
      
      -- 抽佣记录表
      CREATE TABLE IF NOT EXISTS commission_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        order_amount REAL NOT NULL,
        platform_commission REAL NOT NULL,
        carrier_commission REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
        paid_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
      
      -- 系统设置表
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        value_type TEXT DEFAULT 'string' CHECK(value_type IN ('string', 'number', 'boolean', 'json')),
        description TEXT,
        is_public INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- 车辆位置追踪表
      CREATE TABLE IF NOT EXISTS vehicle_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        plate_number TEXT NOT NULL,
        tenant_id INTEGER,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed REAL DEFAULT 0,
        direction REAL,
        status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'transporting', 'maintenance', 'offline')),
        address TEXT,
        accuracy REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
      CREATE INDEX IF NOT EXISTS idx_violations_tenant ON violations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_commission_records_order ON commission_records(order_id);
      CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
      CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
      CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle ON vehicle_positions(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_vehicle_positions_created ON vehicle_positions(created_at);
    `, (err) => {
      if (err) {
        console.error('创建管理表失败:', err);
        return reject(err);
      }
      console.log('✅ 管理表创建成功');
      resolve();
    });
  });
}

async function down() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    db.exec(`
      DROP TABLE IF EXISTS commission_records;
      DROP TABLE IF EXISTS commission_tiers;
      DROP TABLE IF EXISTS commission_configs;
      DROP TABLE IF EXISTS vehicle_positions;
      DROP TABLE IF EXISTS system_settings;
      DROP TABLE IF EXISTS violations;
    `, (err) => {
      if (err) {
        console.error('删除管理表失败:', err);
        return reject(err);
      }
      console.log('✅ 管理表已删除');
      resolve();
    });
  });
}

module.exports = { up, down };
