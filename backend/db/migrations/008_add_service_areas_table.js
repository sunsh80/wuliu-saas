/**
 * 迁移脚本：添加 service_areas 表
 * 用于存储承运商（租户）的服务区域信息
 */

const { getDb } = require('../db');

async function up() {
  const db = await getDb();

  // 检查表是否已存在
  const tableExists = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='service_areas'"
  );

  if (tableExists) {
    console.log('ℹ️ service_areas 表已存在');
    return;
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS service_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      polygon_coordinates TEXT,
      center_lat REAL,
      center_lng REAL,
      radius_km REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    )
  `);

  console.log('✅ service_areas 表已创建');
}

async function down() {
  const db = await getDb();
  await db.run('DROP TABLE IF EXISTS service_areas');
  console.log('✅ service_areas 表已删除');
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
