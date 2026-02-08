// 检查数据库表字段命名规范
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库表字段命名规范...\n');

// 检查订单表字段
db.serialize(() => {
  console.log('📋 订单表 (orders) 字段:');
  db.each("PRAGMA table_info(orders)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name} (${row.type})`);
  });

  console.log('\n👥 租户表 (tenants) 字段:');
  db.each("PRAGMA table_info(tenants)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name} (${row.type})`);
  });

  console.log('\n👤 用户表 (users) 字段:');
  db.each("PRAGMA table_info(users)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name} (${row.type})`);
  });

  console.log('\n🚚 车辆表 (tenant_vehicles) 字段:');
  db.each("PRAGMA table_info(tenant_vehicles)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name} (${row.type})`);
  });
  
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});