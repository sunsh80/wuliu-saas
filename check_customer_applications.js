// 检查customer_applications表
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查customer_applications表...\n');

db.serialize(() => {
  // 检查customer_applications表中的所有状态值
  console.log('📋 customer_applications 表中的所有状态值:');
  db.each("SELECT DISTINCT status FROM customer_applications ORDER BY status", (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  - ${row.status}`);
    }
  });

  // 检查customer_applications表中的所有数据
  console.log('\n📋 customer_applications 表中的所有数据:');
  db.each("SELECT id, name, contact_person, contact_phone, email, status, created_at FROM customer_applications ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Contact: ${row.contact_person}, Phone: ${row.contact_phone}, Email: ${row.email}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查tenants表中的所有数据
  console.log('\n📋 tenants 表中的所有数据:');
  db.each("SELECT id, name, contact_person, contact_phone, email, status, roles, created_at FROM tenants ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Contact: ${row.contact_person}, Phone: ${row.contact_phone}, Email: ${row.email}, Status: ${row.status}, Roles: ${row.roles}, Created: ${row.created_at}`);
    }
  });
  
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});