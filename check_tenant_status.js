// 检查数据库中租户的状态
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中租户的状态...\n');

db.serialize(() => {
  // 检查所有租户及其状态
  console.log('📋 所有租户及其状态:');
  db.each("SELECT id, name, status, roles, created_at FROM tenants ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  ID: ${row.id}, Name: ${row.name}, Status: ${row.status}, Roles: ${row.roles}, Created: ${row.created_at}`);
  });

  // 统计各种状态的租户数量
  console.log('\n📊 各状态租户数量统计:');
  db.each("SELECT status, COUNT(*) as count FROM tenants GROUP BY status", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  ${row.status}: ${row.count} 个`);
  });
  
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});