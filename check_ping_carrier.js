// 检查数据库中名为"ping"且角色为"carrier"的承运商
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中名为"ping"且角色为"carrier"的承运商...\n');

db.serialize(() => {
  // 检查tenants表中是否有名为"ping"且包含carrier角色的租户
  console.log('📋 检查tenants表中名为"ping"且包含carrier角色的租户:');
  db.each("SELECT * FROM tenants WHERE name LIKE '%ping%' OR roles LIKE '%carrier%'", (err, row) => {
    if (err) {
      console.error('查询tenants表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Roles: ${row.roles}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查users表中是否有名为"ping"且角色为"carrier"的用户
  console.log('\n📋 检查users表中名为"ping"且角色为"carrier"的用户:');
  db.each("SELECT * FROM users WHERE name LIKE '%ping%' OR role = 'carrier' OR roles LIKE '%carrier%'", (err, row) => {
    if (err) {
      console.error('查询users表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Username: ${row.username}, Name: ${row.name}, Role: ${row.role}, Roles: ${row.roles}, Type: ${row.type}, Status: ${row.status}`);
    }
  });

  // 检查customer_applications表中是否有名为"ping"且状态为approved的申请
  console.log('\n📋 检查customer_applications表中名为"ping"且状态为approved的申请:');
  db.each("SELECT * FROM customer_applications WHERE name LIKE '%ping%' AND status = 'approved'", (err, row) => {
    if (err) {
      console.log('查询customer_applications表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Phone: ${row.phone}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查customer_applications表中的所有数据
  console.log('\n📋 customer_applications表中的所有数据:');
  db.each("SELECT * FROM customer_applications ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('customer_applications表可能为空:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Phone: ${row.phone}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});