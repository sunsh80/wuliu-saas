const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库并查询新石器车型
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 查询数据库中的新石器车型...');

// 查询所有新石器车型
db.all("SELECT * FROM vehicle_models WHERE brand LIKE '%新石器%'", [], (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
  } else {
    if (rows.length > 0) {
      console.log('✅ 找到新石器车型:', rows.length, '条记录');
      rows.forEach(row => {
        console.log(`   - ID: ${row.id}`);
        console.log(`     品牌: ${row.brand}`);
        console.log(`     型号: ${row.model_name}`);
        console.log(`     类型: ${row.vehicle_type}`);
        console.log(`     自动驾驶等级: ${row.autonomous_level}`);
        console.log(`     最大载重: ${row.max_load_capacity}kg`);
        console.log(`     最大容积: ${row.max_volume}m³`);
        console.log('');
      });
    } else {
      console.log('❌ 未找到新石器车型');
      
      // 查询所有车型作为参考
      console.log('📋 所有车型列表:');
      db.all("SELECT id, brand, model_name, vehicle_type FROM vehicle_models", [], (err, allRows) => {
        if (err) {
          console.error('❌ 查询所有车型失败:', err.message);
        } else {
          allRows.forEach(row => {
            console.log(`   - ID: ${row.id}, 品牌: ${row.brand}, 型号: ${row.model_name}, 类型: ${row.vehicle_type}`);
          });
        }
        db.close();
      });
      return;
    }
  }
  
  db.close();
});