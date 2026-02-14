/**
 * 使用 sqlite3 检查数据库
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
console.log('🔍 正在打开数据库:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 打开数据库失败:', err);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 检查表是否存在
db.serialize(() => {
  console.log('📊 检查vehicle_models表...');
  
  // 检查表是否存在
  db.get(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='vehicle_models'
  `, (err, row) => {
    if (err) {
      console.error('❌ 查询表信息失败:', err);
      return;
    }
    
    if (!row) {
      console.log('❌ vehicle_models 表不存在');
      db.close();
      return;
    }
    
    console.log('✅ vehicle_models 表存在');
    
    // 检查表中是否有数据
    db.get('SELECT COUNT(*) as count FROM vehicle_models', (err, countRow) => {
      if (err) {
        console.error('❌ 查询计数失败:', err);
        return;
      }
      
      console.log(`📈 vehicle_models 表中有 ${countRow.count} 条记录`);
      
      if (countRow.count > 0) {
        console.log('\n📋 前几条车型数据:');
        
        // 查询前5条数据
        db.all('SELECT * FROM vehicle_models LIMIT 5', (err, rows) => {
          if (err) {
            console.error('❌ 查询数据失败:', err);
            return;
          }
          
          rows.forEach((model, index) => {
            console.log(`${index + 1}. ID: ${model.id}, 品牌: ${model.brand || 'N/A'}, 车型名称: ${model.model_name || 'N/A'}, 类型: ${model.vehicle_type || 'N/A'}`);
          });
          
          // 检查表结构
          console.log('\n📋 vehicle_models 表结构:');
          db.all("PRAGMA table_info('vehicle_models')", (err, columns) => {
            if (err) {
              console.error('❌ 查询表结构失败:', err);
              return;
            }
            
            columns.forEach(column => {
              console.log(`   - ${column.name} (${column.type}), ${column.notnull ? 'NOT NULL' : 'NULL'}, 默认值: ${column.dflt_value || '无'}`);
            });
            
            db.close(() => {
              console.log('🏁 检查完成，数据库连接已关闭');
            });
          });
        });
      } else {
        console.log('⚠️ vehicle_models 表中没有数据');
        
        // 检查表结构
        console.log('\n📋 vehicle_models 表结构:');
        db.all("PRAGMA table_info('vehicle_models')", (err, columns) => {
          if (err) {
            console.error('❌ 查询表结构失败:', err);
            return;
          }
          
          columns.forEach(column => {
            console.log(`   - ${column.name} (${column.type}), ${column.notnull ? 'NOT NULL' : 'NULL'}, 默认值: ${column.dflt_value || '无'}`);
          });
          
          db.close(() => {
            console.log('🏁 检查完成，数据库连接已关闭');
          });
        });
      }
    });
  });
});