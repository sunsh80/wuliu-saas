const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 直接测试数据库查询
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 直接测试数据库查询...');

// 测试查询车辆模型表
db.all("SELECT COUNT(*) as total FROM vehicle_models", [], (err, result) => {
  if (err) {
    console.error('❌ 数据库查询失败:', err.message);
  } else {
    console.log('✅ 数据库查询成功，车型总数:', result[0].total);
    
    // 再次查询前几条记录
    db.all("SELECT * FROM vehicle_models LIMIT 5", [], (err, rows) => {
      if (err) {
        console.error('❌ 查询车型记录失败:', err.message);
      } else {
        console.log('✅ 成功获取车型记录:', rows.length, '条');
        rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ID: ${row.id}, 品牌: ${row.brand}, 型号: ${row.model_name}`);
        });
      }
      
      db.close();
    });
  }
});