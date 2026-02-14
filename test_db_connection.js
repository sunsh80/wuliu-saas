const { getDb } = require('./backend/db');

console.log('🔍 测试数据库连接...');

async function testDbConnection() {
  try {
    const db = getDb();
    
    // 测试简单查询
    console.log('🔍 执行简单查询...');
    const result = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM vehicle_models", [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    console.log('✅ 数据库查询成功:', result);
    
    // 测试新石器车型查询
    console.log('🔍 查询新石器车型...');
    const newStoneResult = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM vehicle_models WHERE brand LIKE '%新石器%'", [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log('✅ 新石器车型查询成功:', newStoneResult.length, '条记录');
    newStoneResult.forEach(row => {
      console.log(`   - ID: ${row.id}, 品牌: ${row.brand}, 型号: ${row.model_name}`);
    });
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
  }
}

testDbConnection();