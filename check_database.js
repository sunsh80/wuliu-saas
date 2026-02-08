// 检查数据库内容的脚本
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库内容...\n');

// 查询订单表
db.serialize(() => {
  // 检查订单表结构和数据
  console.log('📋 订单表结构:');
  db.each("PRAGMA table_info(orders)", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`  ${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.pk ? '- PRIMARY KEY' : ''}`);
  });

  console.log('\n📦 订单表数据:');
  db.get("SELECT COUNT(*) as count FROM orders", [], (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  总订单数: ${row.count}`);
      
      // 如果有订单，显示前几条
      if (row.count > 0) {
        console.log('\n  前5条订单记录:');
        db.all("SELECT * FROM orders LIMIT 5", [], (err, rows) => {
          if (err) {
            console.error(err.message);
          } else {
            rows.forEach((row, index) => {
              console.log(`    ${index + 1}. ID: ${row.id}, Tracking: ${row.tracking_number}, Status: ${row.status}, Created: ${row.created_at}`);
            });
          }
        });
      }
    }
  });

  // 检查租户表
  console.log('\n👥 租户表数据:');
  db.get("SELECT COUNT(*) as count FROM tenants", [], (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  总租户数: ${row.count}`);
      
      if (row.count > 0) {
        console.log('\n  前5条租户记录:');
        db.all("SELECT id, name, roles, status FROM tenants LIMIT 5", [], (err, rows) => {
          if (err) {
            console.error(err.message);
          } else {
            rows.forEach((row, index) => {
              console.log(`    ${index + 1}. ID: ${row.id}, Name: ${row.name}, Roles: ${row.roles}, Status: ${row.status}`);
            });
          }
        });
      }
    }
  });

  // 检查用户表
  console.log('\n👤 用户表数据:');
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  总用户数: ${row.count}`);
      
      if (row.count > 0) {
        console.log('\n  前5条用户记录:');
        db.all("SELECT id, username, name, role, roles, type FROM users LIMIT 5", [], (err, rows) => {
          if (err) {
            console.error(err.message);
          } else {
            rows.forEach((row, index) => {
              console.log(`    ${index + 1}. ID: ${row.id}, Username: ${row.username}, Name: ${row.name}, Role: ${row.role}, Type: ${row.type}`);
            });
          }
        });
      }
    }
  });

  // 检查车辆表
  console.log('\n🚗 车辆表数据:');
  db.get("SELECT COUNT(*) as count FROM tenant_vehicles", [], (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`  总车辆数: ${row.count}`);
      
      if (row.count > 0) {
        console.log('\n  前5条车辆记录:');
        db.all("SELECT id, tenant_id, plate_number, type, status FROM tenant_vehicles LIMIT 5", [], (err, rows) => {
          if (err) {
            console.error(err.message);
          } else {
            rows.forEach((row, index) => {
              console.log(`    ${index + 1}. ID: ${row.id}, Tenant ID: ${row.tenant_id}, Plate: ${row.plate_number}, Type: ${row.type}, Status: ${row.status}`);
            });
          }
        });
      }
    }
  });
  
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});