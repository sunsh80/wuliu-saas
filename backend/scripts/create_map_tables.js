// backend/scripts/create_map_tables.js
const { getDb } = require('../db/index');

async function createMapTables() {
  try {
    const db = getDb();

    console.log('Creating stop_points table...');
    // 修改 stop_points 表结构，添加审批相关字段
    await db.run(`
      CREATE TABLE IF NOT EXISTS stop_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        type TEXT DEFAULT 'other',
        region TEXT,
        status TEXT DEFAULT 'active',
        capacity INTEGER DEFAULT 1,
        description TEXT,
        -- 审批相关字段
        tenant_id INTEGER,
        uploaded_by INTEGER,
        upload_source TEXT DEFAULT 'manual',
        approval_status TEXT DEFAULT 'approved',
        approved_by INTEGER,
        approved_at DATETIME,
        rejection_reason TEXT,
        -- 时间戳
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ stop_points table created (or already existed)');

    // 添加租户上传相关的触发器
    console.log('Creating triggers for stop_points...');
    
    // 触发器：租户上传时自动设置为待审批状态
    try {
      await db.run(`
        CREATE TRIGGER IF NOT EXISTS stop_points_before_insert
        BEFORE INSERT ON stop_points
        BEGIN
          UPDATE stop_points SET 
            approval_status = 'pending',
            uploaded_by = NEW.uploaded_by,
            upload_source = NEW.upload_source
          WHERE id = NEW.id AND upload_source = 'tenant';
        END;
      `);
      console.log('✓ Trigger for stop_points auto-approval created');
    } catch (triggerErr) {
      console.log('ℹ Trigger creation skipped:', triggerErr.message);
    }

    console.log('Creating vehicle_positions table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS vehicle_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL,
        lat REAL,
        lng REAL,
        timestamp INTEGER,
        battery REAL,
        speed REAL,
        heading REAL,
        status TEXT DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ vehicle_positions table created (or already existed)');

    console.log('Creating vehicle_tracking table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS vehicle_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT UNIQUE NOT NULL,
        lat REAL,
        lng REAL,
        status TEXT DEFAULT 'offline',
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        battery REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ vehicle_tracking table created (or already existed)');

    // 创建触发器来自动更新 updated_at 字段
    try {
      await db.run(`
        CREATE TRIGGER IF NOT EXISTS update_stop_points_updated_at
        AFTER UPDATE ON stop_points
        BEGIN
          UPDATE stop_points SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
      console.log('✓ Trigger for stop_points updated_at created');
    } catch (triggerErr) {
      console.log('ℹ Trigger creation skipped (may not be supported):', triggerErr.message);
    }

    console.log('\n✓ All map-related tables have been created successfully!');
  } catch (error) {
    console.error('❌ Error creating map tables:', error);
  }
}

// 执行函数
createMapTables().then(() => {
  console.log('Script completed.');
}).catch(err => {
  console.error('Script failed:', err);
});
