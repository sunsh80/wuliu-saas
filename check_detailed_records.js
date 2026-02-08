// 详细检查ID为1的租户和申请记录
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 详细检查ID为1的租户和申请记录...\n');

db.serialize(() => {
  // 检查tenants表中ID为1的租户
  console.log('📋 检查tenants表中ID为1的租户:');
  db.get('SELECT * FROM tenants WHERE id = 1', (err, row) => {
    if (err) {
      console.error('查询tenants表错误:', err.message);
    } else if (row) {
      console.log('Tenants表中ID为1的租户:');
      console.log(`  ID: ${row.id}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Contact Person: ${row.contact_person}`);
      console.log(`  Contact Phone: ${row.contact_phone}`);
      console.log(`  Email: ${row.email}`);
      console.log(`  Roles: ${row.roles}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Created At: ${row.created_at}`);
      console.log(`  Updated At: ${row.updated_at}`);
      console.log('');
    } else {
      console.log('Tenants表中没有ID为1的租户');
      console.log('');
    }
  });

  // 检查customer_applications表中ID为1的记录
  console.log('📋 检查customer_applications表中ID为1的记录:');
  db.get('SELECT * FROM customer_applications WHERE id = 1', (err, row) => {
    if (err) {
      console.error('查询customer_applications表错误:', err.message);
    } else if (row) {
      console.log('Customer_applications表中ID为1的记录:');
      console.log(`  ID: ${row.id}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Phone: ${row.phone}`);
      console.log(`  Address: ${row.address}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Created At: ${row.created_at}`);
      console.log(`  Updated At: ${row.updated_at}`);
      console.log('');
    } else {
      console.log('Customer_applications表中没有ID为1的记录');
      console.log('');
    }
  });

  // 检查所有包含carrier角色的记录
  console.log('📋 检查所有包含carrier角色的记录:');
  db.each("SELECT 'tenants' as table_name, id, name, roles, status FROM tenants WHERE roles LIKE '%carrier%' UNION ALL SELECT 'customer_applications' as table_name, id, name, 'N/A' as roles, status FROM customer_applications WHERE name LIKE '%string%'", (err, row) => {
    if (err) {
      console.error('查询包含carrier角色的记录错误:', err.message);
    } else {
      console.log(`  Table: ${row.table_name}, ID: ${row.id}, Name: ${row.name}, Roles: ${row.roles}, Status: ${row.status}`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});