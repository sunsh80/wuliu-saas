const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 验证新车型软删除是否成功...\n');

// 查询ID为15的车型
db.get('SELECT * FROM vehicle_models WHERE id = 15', (err, model) => {
  if (err) {
    console.error('❌ 查询车型失败:', err.message);
  } else {
    if (model) {
      console.log('✅ 找到车型ID 15:');
      console.log(`   - 品牌: ${model.brand}`);
      console.log(`   - 型号: ${model.model_name}`);
      console.log(`   - 状态: ${model.status}`);
      console.log(`   - 删除时间: ${model.deleted_at}`);
      console.log(`   - 制造商: ${model.manufacturer}`);
    } else {
      console.log('❌ 未找到车型ID 15');
    }
  }

  console.log('\n🔍 检查该车型是否在活动列表中（应该不在）...');
  
  // 查询所有未删除的车型
  db.all('SELECT id, brand, model_name, status FROM vehicle_models WHERE status != \'deleted\' ORDER BY id DESC LIMIT 5', (err, models) => {
    if (err) {
      console.error('❌ 查询车型列表失败:', err.message);
    } else {
      console.log(`\n📊 未删除的车型列表 (最近5个):`);
      models.forEach(model => {
        console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 状态: ${model.status}`);
      });
      
      const deletedModelStillExists = models.some(model => model.id === 15);
      if (deletedModelStillExists) {
        console.log('\n⚠️  警告：已删除的车型仍在列表中');
      } else {
        console.log('\n✅ 验证成功：已删除的车型不在活动列表中');
      }
    }
    
    // 查询所有车型（包括已删除的）
    console.log('\n🔍 查询所有车型（包括已删除的）...');
    db.all('SELECT id, brand, model_name, status, deleted_at FROM vehicle_models WHERE id = 15 ORDER BY id DESC', (err, allModels) => {
      if (err) {
        console.error('❌ 查询所有车型失败:', err.message);
      } else {
        console.log('\n📊 已删除的车型:');
        allModels.forEach(model => {
          console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 状态: ${model.status}, 删除时间: ${model.deleted_at || 'N/A'}`);
        });
      }
      
      db.close();
    });
  });
});