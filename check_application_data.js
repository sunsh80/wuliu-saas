// 检查customer_applications表中的数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查customer_applications表中的数据...\n');

db.serialize(() => {
  // 检查customer_applications表中的所有数据
  console.log('📋 customer_applications表中的所有数据:');
  db.each("SELECT * FROM customer_applications ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('customer_applications表可能为空或不存在:', err.message);
    } else {
      console.log('  数据:', JSON.stringify(row));
    }
  });

  // 检查customer_applications表中的状态统计
  console.log('\n📊 customer_applications表中状态统计:');
  db.each("SELECT status, COUNT(*) as count FROM customer_applications GROUP BY status", (err, row) => {
    if (err) {
      console.log('无法获取状态统计:', err.message);
    } else {
      console.log(`  ${row.status}: ${row.count} 个`);
    }
  });

  // 检查tenants表中的数据
  console.log('\n📋 tenants表中的数据:');
  db.each("SELECT id, name, status, created_at FROM tenants ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('无法获取tenants表数据:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('Close error:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});