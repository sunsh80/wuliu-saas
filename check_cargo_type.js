const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在连接数据库:', dbPath);

// 检查表结构
db.serialize(() => {
  console.log('\n=== 检查 orders 表结构 ===');
  db.each("PRAGMA table_info(orders)", (err, row) => {
    if (err) {
      console.error('错误:', err);
    } else {
      console.log(`${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${row.dflt_value}`);
    }
  });

  console.log('\n=== 检查最近的订单数据 (不包含cargo_type) ===');
  db.all("SELECT id, tracking_number, description, sender_info, receiver_info, weight_kg, volume_m3, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10", (err, rows) => {
    if (err) {
      console.error('查询错误:', err);
    } else {
      console.log('找到', rows.length, '个订单');
      if (rows.length > 0) {
        rows.forEach((row, index) => {
          console.log(`\n订单 ${index + 1}:`);
          console.log(`  ID: ${row.id}`);
          console.log(`  跟踪号: ${row.tracking_number}`);
          console.log(`  描述: ${row.description || '(空)'}`);
          console.log(`  重量: ${row.weight_kg || '(空)'} kg`);
          console.log(`  体积: ${row.volume_m3 || '(空)'} m³`);
          console.log(`  状态: ${row.status}`);
          console.log(`  创建时间: ${row.created_at}`);
        });
      } else {
        console.log('没有找到订单数据');
      }
    }
    
    // 尝试添加 cargo_type 列
    console.log('\n=== 尝试添加 cargo_type 列 ===');
    db.run("ALTER TABLE orders ADD COLUMN cargo_type TEXT;", (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('cargo_type 列已存在');
        } else {
          console.log('添加 cargo_type 列时出错 (这可能是因为列已存在):', err.message);
        }
      } else {
        console.log('cargo_type 列已成功添加到 orders 表');
      }
      
      // 再次查询，现在应该包含 cargo_type
      console.log('\n=== 再次检查最近的订单数据 (现在包含cargo_type) ===');
      db.all("SELECT id, tracking_number, cargo_type, description, weight_kg, volume_m3, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10", (err, rows) => {
        if (err) {
          console.error('查询错误:', err);
        } else {
          console.log('找到', rows.length, '个订单');
          if (rows.length > 0) {
            rows.forEach((row, index) => {
              console.log(`\n订单 ${index + 1}:`);
              console.log(`  ID: ${row.id}`);
              console.log(`  跟踪号: ${row.tracking_number}`);
              console.log(`  货物类型: ${row.cargo_type || '(空)'}`);
              console.log(`  描述: ${row.description || '(空)'}`);
              console.log(`  重量: ${row.weight_kg || '(空)'} kg`);
              console.log(`  体积: ${row.volume_m3 || '(空)'} m³`);
              console.log(`  状态: ${row.status}`);
              console.log(`  创建时间: ${row.created_at}`);
            });
          } else {
            console.log('没有找到订单数据');
          }
        }
        
        // 关闭数据库连接
        db.close((err) => {
          if (err) {
            console.error('关闭数据库时出错:', err);
          } else {
            console.log('\n数据库连接已关闭');
          }
        });
      });
    });
  });
});