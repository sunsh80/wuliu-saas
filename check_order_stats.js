// 检查数据库中订单状态分布的脚本
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查订单状态分布...\n');

// 查询订单状态分布
db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", [], (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('📊 订单状态分布:');
    rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} 个`);
    });
  }
  
  // 查询租户角色分布
  db.all("SELECT roles, COUNT(*) as count FROM tenants GROUP BY roles", [], (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('\n👥 租户角色分布:');
      rows.forEach(row => {
        console.log(`  ${row.roles}: ${row.count} 个`);
      });
    }
    
    // 查询用户信息
    db.all("SELECT username, role, type FROM users", [], (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('\n👤 用户信息:');
        rows.forEach(row => {
          console.log(`  Username: ${row.username}, Role: ${row.role}, Type: ${row.type}`);
        });
      }
      
      // 查询具体订单信息
      db.all("SELECT id, tracking_number, status, created_at FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log('\n📋 最新订单信息:');
          rows.forEach(row => {
            console.log(`  ID: ${row.id}, Tracking: ${row.tracking_number}, Status: ${row.status}, Created: ${row.created_at}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log('\n✅ 数据库连接已关闭');
        });
      });
    });
  });
});