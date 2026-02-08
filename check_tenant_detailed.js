// 检查数据库中租户的详细信息（分别查询）
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中租户的详细信息...\n');

db.serialize(() => {
  // 检查tenants表中的所有数据
  console.log('📋 tenants表中的所有数据:');
  db.each("SELECT id, name, contact_person, contact_phone, email, roles, status, created_at FROM tenants ORDER BY id", (err, row) => {
    if (err) {
      console.error('查询tenants表错误:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Contact: ${row.contact_person}, Phone: ${row.contact_phone}, Roles: ${row.roles}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查customer_applications表中的所有数据
  console.log('\n📋 customer_applications表中的所有数据:');
  db.each("SELECT id, name, phone, address, status, created_at FROM customer_applications ORDER BY id", (err, row) => {
    if (err) {
      console.log('customer_applications表可能为空:', err.message);
    } else {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Phone: ${row.phone}, Address: ${row.address}, Status: ${row.status}, Created: ${row.created_at}`);
    }
  });

  // 检查ID为1的租户详细信息
  console.log('\n🔍 详细检查ID为1的租户:');
  db.get("SELECT * FROM tenants WHERE id = 1", (err, row) => {
    if (err) {
      console.error('查询ID为1的租户错误:', err.message);
    } else if (row) {
      console.log(`  ID: ${row.id}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Contact Person: ${row.contact_person}`);
      console.log(`  Contact Phone: ${row.contact_phone}`);
      console.log(`  Email: ${row.email}`);
      console.log(`  Roles: ${row.roles}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Created At: ${row.created_at}`);
      console.log(`  Address: ${row.address}`);
      console.log(`  Service Radius km: ${row.service_radius_km}`);
      console.log(`  Capacity kg: ${row.capacity_kg}`);
      console.log(`  Capacity m3: ${row.capacity_m3}`);
      console.log(`  Base Price per km: ${row.base_price_per_km}`);
      console.log(`  Avg Rating: ${row.avg_rating}`);
    } else {
      console.log('  未找到ID为1的租户');
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});