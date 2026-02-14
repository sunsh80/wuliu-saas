const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中所有车型...\n');

// 查询所有车型，按ID排序
db.all('SELECT id, brand, model_name, status, deleted_at FROM vehicle_models ORDER BY id ASC', (err, allModels) => {
  if (err) {
    console.error('❌ 查询所有车型失败:', err.message);
  } else {
    console.log(`📊 所有车型（共 ${allModels.length} 个）:`);
    allModels.forEach(model => {
      console.log(`   - ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 状态: ${model.status}, 删除时间: ${model.deleted_at || 'N/A'}`);
    });
    
    // 检查ID范围
    const ids = allModels.map(model => model.id);
    console.log(`\n🔢 ID范围: ${Math.min(...ids)} - ${Math.max(...ids)}`);
    
    // 检查是否有缺失的ID
    const expectedIds = Array.from({length: Math.max(...ids)}, (_, i) => i + 1);
    const missingIds = expectedIds.filter(id => !ids.includes(id));
    if (missingIds.length > 0) {
      console.log(`\n⚠️  缺失的ID: ${missingIds.join(', ')}`);
    }
  }
  
  db.close();
});