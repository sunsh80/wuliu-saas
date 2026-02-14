const { openDatabaseAndInitialize } = require('./backend/db');

async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  try {
    // 初始化数据库
    const dbManager = await openDatabaseAndInitialize();
    console.log('✅ 数据库初始化完成');
    
    // 获取数据库实例
    const db = dbManager.getDb();
    
    // 检查vehicle_models表是否存在
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_models';", (err, rows) => {
      if (err) {
        console.error('❌ 检查vehicle_models表时出错:', err.message);
        return;
      }
      
      if (rows.length > 0) {
        console.log('✅ vehicle_models表已创建');
        
        // 查询车型数据
        db.all('SELECT COUNT(*) as count FROM vehicle_models;', (err, result) => {
          if (err) {
            console.error('❌ 查询车型数量失败:', err.message);
            return;
          }
          
          console.log(`📊 vehicle_models表中有 ${result[0].count} 条记录`);
          
          if (result[0].count > 0) {
            db.all('SELECT * FROM vehicle_models ORDER BY created_at DESC LIMIT 3;', (err, rows) => {
              if (err) {
                console.error('❌ 查询车型数据失败:', err.message);
                return;
              }
              
              console.log('\n📋 车型数据示例:');
              rows.forEach((model, index) => {
                console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 类型: ${model.vehicle_type}, 自动驾驶级别: ${model.autonomous_level}`);
              });
            });
          } else {
            console.log('⚠️  vehicle_models表中没有数据，但默认数据应该已插入');
          }
        });
      } else {
        console.log('❌ vehicle_models表仍然不存在');
      }
    });
  } catch (error) {
    console.error('💥 初始化数据库时出错:', error.message);
  }
}

initializeDatabase();