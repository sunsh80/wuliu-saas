const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查已删除的车型（状态为deleted）...\n');

// 查询所有已删除的车型
db.all('SELECT id, brand, model_name, status, deleted_at FROM vehicle_models WHERE status = \'deleted\' ORDER BY id DESC', (err, deletedModels) => {
  if (err) {
    console.error('❌ 查询已删除车型失败:', err.message);
  } else {
    if (deletedModels.length > 0) {
      console.log(`📊 已删除的车型（共 ${deletedModels.length} 个）:`);
      deletedModels.forEach(model => {
        console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 状态: ${model.status}, 删除时间: ${model.deleted_at}`);
      });
    } else {
      console.log('❌ 没有找到状态为\'deleted\'的车型');
    }
  }

  console.log('\n🔍 检查是否有ID为14或15的车型（无论状态）...');
  
  // 查询特定ID的车型
  db.all('SELECT id, brand, model_name, status, deleted_at FROM vehicle_models WHERE id IN (14, 15) ORDER BY id', (err, specificModels) => {
    if (err) {
      console.error('❌ 查询特定车型失败:', err.message);
    } else {
      if (specificModels.length > 0) {
        console.log(`\n📊 ID为14或15的车型:`);
        specificModels.forEach(model => {
          console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 状态: ${model.status}, 删除时间: ${model.deleted_at || 'N/A'}`);
        });
      } else {
        console.log('\n❌ 没有找到ID为14或15的车型');
      }
    }
    
    db.close();
  });
});