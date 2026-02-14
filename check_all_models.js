const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 查询所有车型（包括已删除的）...\n');

// 查询所有车型
db.all('SELECT id, brand, model_name, status, deleted_at FROM vehicle_models ORDER BY id DESC', (err, allModels) => {
  if (err) {
    console.error('❌ 查询所有车型失败:', err.message);
  } else {
    console.log(`📊 所有车型（共 ${allModels.length} 个）:`);
    allModels.forEach(model => {
      console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 状态: ${model.status}, 删除时间: ${model.deleted_at || 'N/A'}`);
    });
  }
  
  // 特别查询ID为14的车型
  console.log('\n🔍 特别查询ID为14的车型...');
  db.get('SELECT * FROM vehicle_models WHERE id = 14', (err, model) => {
    if (err) {
      console.error('❌ 查询车型ID 14失败:', err.message);
    } else {
      if (model) {
        console.log('✅ 找到车型ID 14:');
        console.log(`   - 品牌: ${model.brand}`);
        console.log(`   - 型号: ${model.model_name}`);
        console.log(`   - 状态: ${model.status}`);
        console.log(`   - 删除时间: ${model.deleted_at}`);
      } else {
        console.log('❌ 未找到车型ID 14，可能已被物理删除');
      }
    }
    
    db.close();
  });
});