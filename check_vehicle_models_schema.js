const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查vehicle_models表结构...\n');

// 查询表结构
db.all("PRAGMA table_info(vehicle_models)", (err, rows) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err.message);
  } else {
    console.log('📋 vehicle_models表结构:');
    rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.type} (not_null: ${row.notnull}, pk: ${row.pk})`);
    });
  }

  console.log('\n📊 查询车型数据示例...');
  
  // 查询车型表内容
  db.all("SELECT * FROM vehicle_models ORDER BY id DESC LIMIT 5", (err, models) => {
    if (err) {
      console.error('❌ 查询车型数据失败:', err.message);
    } else {
      console.log('\n最近的车型数据:');
      models.forEach(model => {
        console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 类型: ${model.vehicle_type}`);
      });
    }
    
    db.close();
  });
});