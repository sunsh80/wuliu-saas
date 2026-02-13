/**
 * 为tenant_vehicles表添加vehicle_model_id字段
 * 用于关联车型库中的车型
 */
exports.up = async function(db) {
  // 检查字段是否已存在
  const columns = await db.all("PRAGMA table_info(tenant_vehicles)");
  const hasVehicleModelId = columns.some(col => col.name === 'vehicle_model_id');
  
  if (!hasVehicleModelId) {
    // 添加vehicle_model_id字段
    await db.run("ALTER TABLE tenant_vehicles ADD COLUMN vehicle_model_id INTEGER");
    console.log('✅ tenant_vehicles表已添加vehicle_model_id字段');
  } else {
    console.log('ℹ️ tenant_vehicles表已存在vehicle_model_id字段');
  }
  
  // 为vehicle_model_id字段添加外键约束（如果不存在）
  try {
    // SQLite不支持直接添加外键约束，所以我们创建新表并迁移数据
    await db.run(`
      CREATE TABLE IF NOT EXISTS tenant_vehicles_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        vehicle_model_id INTEGER, -- 新增字段
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
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models (id) ON DELETE SET NULL
      )
    `);
    
    // 将现有数据迁移到新表
    await db.run(`
      INSERT INTO tenant_vehicles_new
      SELECT id, tenant_id, NULL, plate_number, type, length, width, height, max_weight, 
             volume, status, driver_name, driver_phone, image_url, created_at, updated_at
      FROM tenant_vehicles
    `);
    
    // 删除旧表
    await db.run("DROP TABLE tenant_vehicles");
    
    // 重命名新表
    await db.run("ALTER TABLE tenant_vehicles_new RENAME TO tenant_vehicles");
    
    console.log('✅ tenant_vehicles表结构已更新，添加了vehicle_model_id外键');
  } catch (error) {
    console.error('更新tenant_vehicles表结构时出错:', error.message);
    // 如果出错，至少确保字段已添加
    console.log('继续执行后续步骤...');
  }
};

exports.down = async function(db) {
  // 由于SQLite限制，我们不能轻易删除外键约束，所以只记录操作
  console.log('⚠️ 降级操作：无法自动删除外键约束，需手动处理');
};