// 检查数据库中租户的详细信息
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中租户的详细信息...\n');

db.serialize(() => {
  // 检查tenants表中的所有数据
  console.log('📋 tenants表中的所有数据:');
  db.each("SELECT id, name, contact_person, contact_phone, email, roles, status, created_at FROM tenants ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.error('查询tenants表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Contact: ${row.contact_person}, Phone: ${row.contact_phone}, Email: ${row.email}, Roles: ${row.roles}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查customer_applications表中的所有数据
  console.log('\n📋 customer_applications表中的所有数据:');
  db.each("SELECT id, name, phone, address, status, created_at FROM customer_applications ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('customer_applications表可能为空:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Phone: ${row.phone}, Address: ${row.address}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查users表中的数据
  console.log('\n📋 users表中的数据:');
  db.each("SELECT id, username, name, role, roles, type, user_type, organization_type, status FROM users ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('查询users表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Username: ${row.username}, Name: ${row.name}, Role: ${row.role}, Roles: ${row.roles}, Type: ${row.type}, User Type: ${row.user_type}, Org Type: ${row.organization_type}, Status: ${row.status}`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});