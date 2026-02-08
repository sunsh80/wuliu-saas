// 检查数据库中承运商相关数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中承运商相关数据...\n');

db.serialize(() => {
  // 检查租户表中具有carrier角色的数据
  console.log('👥 检查租户表中具有carrier角色的数据:');
  db.all("SELECT id, name, roles, status FROM tenants WHERE roles LIKE '%carrier%'", [], (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      if (rows.length > 0) {
        console.log(`  找到 ${rows.length} 个具有carrier角色的租户:`);
        rows.forEach(row => {
          console.log(`    - ID: ${row.id}, Name: ${row.name}, Roles: ${row.roles}, Status: ${row.status}`);
        });
      } else {
        console.log('  未找到具有carrier角色的租户');
      }
    }
    
    // 检查用户表中具有carrier角色的数据
    console.log('\n👤 检查用户表中具有carrier角色的数据:');
    db.all("SELECT id, username, name, role, roles, type FROM users WHERE role = 'carrier' OR roles LIKE '%carrier%'", [], (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        if (rows.length > 0) {
          console.log(`  找到 ${rows.length} 个具有carrier角色的用户:`);
          rows.forEach(row => {
            console.log(`    - ID: ${row.id}, Username: ${row.username}, Name: ${row.name}, Role: ${row.role}, Roles: ${row.roles}, Type: ${row.type}`);
          });
        } else {
          console.log('  未找到具有carrier角色的用户');
        }
      }
      
      // 检查所有租户数据
      console.log('\n📋 检查所有租户数据:');
      db.all("SELECT id, name, roles, status FROM tenants", [], (err, rows) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log(`  总共 ${rows.length} 个租户:`);
          rows.forEach(row => {
            console.log(`    - ID: ${row.id}, Name: ${row.name}, Roles: ${row.roles}, Status: ${row.status}`);
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