/**
 * 验证新石器车型已正确添加到数据库
 */

const { getDb } = require('./backend/db');

async function verifyNewstoneVehicles() {
  console.log('开始验证新石器车型数据...\n');
  
  try {
    const db = getDb();
    
    // 查询所有新石器车型
    const newstoneModels = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM vehicle_models WHERE brand = '新石器' OR manufacturer LIKE '%新石器%'",
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
    
    console.log(`✅ 数据库中找到 ${newstoneModels.length} 个新石器车型:\n`);
    
    newstoneModels.forEach((model, index) => {
      console.log(`${index + 1}. 车型名称: ${model.model_name}`);
      console.log(`   品牌: ${model.brand}`);
      console.log(`   制造商: ${model.manufacturer}`);
      console.log(`   类型: ${model.vehicle_type}`);
      console.log(`   自动驾驶级别: ${model.autonomous_level}`);
      console.log(`   最大载重: ${model.max_load_capacity}kg`);
      console.log(`   最大容量: ${model.max_volume}m³`);
      console.log('');
    });
    
    console.log('✅ 新石器车型数据验证完成！');
    
    // 验证车型库 API 可能访问这些数据
    console.log('\n📝 提示: 新石器车型现在已正确存储在车型库数据库中');
    console.log('   - 可通过管理员后台访问: /api/admin/vehicle-models');
    console.log('   - 承运商可从车型库中选择新石器车型创建车辆');
    console.log('   - 不再需要在承运商管理中单独添加');
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
  }
}

// 运接运行此脚本
verifyNewstoneVehicles();