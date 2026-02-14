const DatabaseSchema = require('./backend/db/schema');
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

// 检查vehicle_models表是否存在及数据情况
db.serialize(() => {
  // 检查表是否存在
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_models';", (err, row) => {
    if (err) {
      console.error('❌ 检查vehicle_models表时出错:', err.message);
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库连接时出错:', err.message);
        } else {
          console.log('🔒 数据库连接已关闭');
        }
      });
      return;
    }

    if (!row) {
      console.log('❌ vehicle_models表不存在');
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库连接时出错:', err.message);
        } else {
          console.log('🔒 数据库连接已关闭');
        }
      });
      return;
    }

    console.log('✅ vehicle_models表存在');

    // 查询车型数据
    db.all('SELECT * FROM vehicle_models ORDER BY created_at DESC;', (err, rows) => {
      if (err) {
        console.error('❌ 查询车型数据失败:', err.message);
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库连接时出错:', err.message);
          } else {
            console.log('🔒 数据库连接已关闭');
          }
        });
        return;
      }

      console.log(`📊 共找到 ${rows.length} 条车型数据:`);

      if (rows.length > 0) {
        console.log('\n📋 车型数据示例:');
        rows.slice(0, 3).forEach((model, index) => {
          console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand}, 型号: ${model.model_name}, 类型: ${model.vehicle_type}, 自动驾驶级别: ${model.autonomous_level}`);
        });

        if (rows.length > 3) {
          console.log(`... 还有 ${rows.length - 3} 条记录`);
        }
      } else {
        console.log('⚠️  vehicle_models表中没有数据');
      }

      // 在查询完成后关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库连接时出错:', err.message);
        } else {
          console.log('🔒 数据库连接已关闭');
        }
      });
    });
  });
});