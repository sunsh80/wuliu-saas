/**
 * 迁移脚本：添加 tenant_applications 表
 * 用于存储承运商（租户）的资质申请信息
 */

const { getDb } = require('../db');

async function up() {
  const db = await getDb();
  
  // 检查表是否已存在
  const tableExists = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='tenant_applications'"
  );
  
  if (tableExists) {
    console.log('ℹ️ tenant_applications 表已存在');
    return;
  }
  
  await db.run(`
    CREATE TABLE IF NOT EXISTS tenant_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      email TEXT,
      business_license TEXT,
      service_area TEXT,
      service_radius_km INTEGER,
      capacity_kg REAL,
      capacity_m3 REAL,
      base_price_per_km REAL,
      license_file TEXT,
      other_files TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    )
  `);
  
  console.log('✅ tenant_applications 表已创建');
}

async function down() {
  const db = await getDb();
  await db.run('DROP TABLE IF EXISTS tenant_applications');
  console.log('✅ tenant_applications 表已删除');
}

module.exports = { up, down };

// 如果直接运行此文件，则执行迁移
if (require.main === module) {
  up()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('迁移失败:', err);
      process.exit(1);
    });
}
