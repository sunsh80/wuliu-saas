const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
console.log('🔍 检查数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 连接数据库失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 检查所有表
db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
    if (err) {
      console.error('❌ 查询表信息失败:', err.message);
      return;
    }
    
    console.log('📋 数据库中存在的表:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
    });
    
    // 检查是否包含vehicle_models表
    const hasVehicleModels = rows.some(row => row.name === 'vehicle_models');
    if (hasVehicleModels) {
      console.log('\n✅ vehicle_models表存在');
      
      // 查询车型数据
      db.all('SELECT * FROM vehicle_models ORDER BY created_at DESC;', (err, rows) => {
        if (err) {
          console.error('❌ 查询车型数据失败:', err.message);
          return;
        }
        
        console.log(`📊 共找到 ${rows.length} 条车型数据:`);
        
        if (rows.length > 0) {
          console.log('\n📋 车型数据示例:');
          rows.slice(0, 5).forEach((model, index) => {
            console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 类型: ${model.vehicle_type}, 自动驾驶级别: ${model.autonomous_level}`);
          });
          
          if (rows.length > 5) {
            console.log(`... 还有 ${rows.length - 5} 条记录`);
          }
        } else {
          console.log('⚠️  vehicle_models表中没有数据');
        }
      });
    } else {
      console.log('\n❌ vehicle_models表不存在');
      console.log('💡 需要运行数据库迁移脚本来创建表');
    }
  });
});

// 关闭数据库连接
db.close((err) => {
  if (err) {
    console.error('❌ 关闭数据库连接时出错:', err.message);
  } else {
    console.log('🔒 数据库连接已关闭');
  }
});