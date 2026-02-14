const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查tenant_vehicles表结构...\n');

// 查询表结构
db.all("PRAGMA table_info(tenant_vehicles)", (err, rows) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err.message);
  } else {
    console.log('📋 tenant_vehicles表结构:');
    rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.type} (not_null: ${row.notnull}, pk: ${row.pk})`);
    });
  }

  console.log('\n🔍 检查vehicle_models表是否存在...');
  
  // 检查vehicle_models表
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_models'", (err, rows) => {
    if (err) {
      console.error('❌ 查询表信息失败:', err.message);
    } else {
      if (rows.length > 0) {
        console.log('✅ vehicle_models表存在');
        
        // 查询车型表内容
        db.all("SELECT * FROM vehicle_models ORDER BY id DESC LIMIT 5", (err, models) => {
          if (err) {
            console.error('❌ 查询车型数据失败:', err.message);
          } else {
            console.log('\n📊 最近的车型数据:');
            models.forEach(model => {
              console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}`);
            });
          }
          
          db.close();
        });
      } else {
        console.log('❌ vehicle_models表不存在');
        db.close();
      }
    }
  });
});