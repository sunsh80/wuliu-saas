const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在验证数据库中的货物类型信息...');

// 查询最新的订单，验证 cargo_type 是否正确存储
db.serialize(() => {
  console.log('\n=== 查询最新订单 ===');
  db.all("SELECT id, tracking_number, cargo_type, description, weight_kg, volume_m3, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5", (err, rows) => {
    if (err) {
      console.error('查询错误:', err);
    } else {
      console.log('找到', rows.length, '个订单');
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