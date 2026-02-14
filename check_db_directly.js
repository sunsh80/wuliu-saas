const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 直接从数据库查询车辆模型
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 直接从数据库查询车辆模型...');

db.all("SELECT * FROM vehicle_models WHERE brand LIKE '%新石器%' OR model_name LIKE '%新石器%'", [], (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
  } else {
    if (rows.length > 0) {
      console.log('✅ 在数据库中找到新石器车型:');
      rows.forEach(row => {
        console.log(`   - ID: ${row.id}, 品牌: ${row.brand}, 型号: ${row.model_name}`);
      });
    } else {
      console.log('❌ 在数据库中未找到新石器车型');
      
      // 查询所有车型
      console.log('📋 所有车型列表:');
      db.all("SELECT id, brand, model_name FROM vehicle_models", [], (err, allRows) => {
        if (err) {
          console.error('❌ 查询所有车型失败:', err.message);
        } else {
          allRows.forEach(row => {
            console.log(`   - ID: ${row.id}, 品牌: ${row.brand}, 型号: ${row.model_name}`);
          });
        }
        db.close();
      });
      return;
    }
  }
  
  db.close();
});