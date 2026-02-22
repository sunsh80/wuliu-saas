/**
 * 数据库迁移脚本：添加缺失的表
 * 
 * 使用方法:
 * node backend/migrate-add-tables.js
 */

const { openDatabaseAndInitialize, getDb } = require('./db');

const TABLES = {
  // --- 违规记录表 ---
  violations: `
    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      tenant_name TEXT,
      violation_type TEXT NOT NULL,
      description TEXT,
      violation_date TEXT,
      severity TEXT DEFAULT 'low',
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      handle_notes TEXT,
      handle_date TEXT,
      penalty_amount REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // --- 车辆位置表 ---
  vehicle_positions: `
    CREATE TABLE IF NOT EXISTS vehicle_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      plate_number TEXT,
      tenant_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      direction REAL,
      status TEXT DEFAULT 'idle',
      address TEXT,
      accuracy REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // --- 车辆表 ---
  vehicles: `
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      plate_number TEXT NOT NULL,
      vehicle_type TEXT,
      vehicle_model_id INTEGER,
      status TEXT DEFAULT 'idle',
      current_address TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      length REAL,
      width REAL,
      height REAL,
      max_weight REAL,
      volume REAL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id) ON DELETE SET NULL
    );
  `,

  // --- 抽佣配置表 ---
  commission_configs: `
    CREATE TABLE IF NOT EXISTS commission_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_rate REAL NOT NULL,
      carrier_rate REAL NOT NULL,
      min_amount REAL,
      max_amount REAL,
      effective_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // --- 抽佣分级表 ---
  commission_tiers: `
    CREATE TABLE IF NOT EXISTS commission_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER NOT NULL,
      min_amount REAL NOT NULL,
      max_amount REAL,
      platform_rate REAL NOT NULL,
      carrier_rate REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (config_id) REFERENCES commission_configs(id) ON DELETE CASCADE
    );
  `,

  // --- 抽佣记录表 ---
  commission_records: `
    CREATE TABLE IF NOT EXISTS commission_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_amount REAL NOT NULL,
      platform_commission REAL NOT NULL,
      carrier_commission REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `
};

async function migrate() {
  console.log('='.repeat(60));
  console.log('🚀 开始数据库迁移：添加缺失的表');
  console.log('='.repeat(60));

  try {
    // 初始化数据库
    await openDatabaseAndInitialize();
    const db = getDb();

    let created = 0;
    let skipped = 0;

    for (const [tableName, sql] of Object.entries(TABLES)) {
      try {
        // 检查表是否已存在
        const tableExists = await db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          [tableName]
        );

        if (tableExists) {
          console.log(`⏭️  表 ${tableName} 已存在，跳过`);
          skipped++;
        } else {
          await db.exec(sql);
          console.log(`✅ 表 ${tableName} 创建成功`);
          created++;
        }
      } catch (error) {
        console.error(`❌ 创建表 ${tableName} 失败:`, error.message);
      }
    }

    console.log('='.repeat(60));
    console.log(`📊 迁移完成：创建 ${created} 个表，跳过 ${skipped} 个表`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('💥 迁移失败:', error);
    process.exit(1);
  }
}

migrate();
