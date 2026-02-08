// 检查数据库中所有可能的租户状态
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中所有租户状态...\n');

db.serialize(() => {
  // 检查租户表中的所有状态值
  console.log('📋 租户表 (tenants) 中的所有状态值:');
  db.each("SELECT DISTINCT status FROM tenants ORDER BY status", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.status}`);
  });

  // 检查是否有其他可能存储入驻申请的表
  console.log('\n📋 数据库中的所有表:');
  db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name}`);
  });

  // 检查 customer_applications 表（如果有）
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='customer_applications'", (err, row) => {
    if (row) {
      console.log('\n📋 customer_applications 表中的状态值:');
      db.each("SELECT DISTINCT status FROM customer_applications ORDER BY status", (err, row) => {
        if (err) {
          console.error(err.message);
        }
        console.log(`  - ${row.status}`);
      });
    } else {
      console.log('\nℹ️  customer_applications 表不存在');
    }
  });

  // 检查 tenants 表的结构
  console.log('\n📋 tenants 表结构:');
  db.each("PRAGMA table_info(tenants)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  - ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
  });
  
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});