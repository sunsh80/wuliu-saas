/**
 * 为vehicle_models表添加status字段
 * 用于支持软删除和车型状态管理
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function addStatusFieldToVehicleModels() {
  const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
  const db = new sqlite3.Database(dbPath);
  
  // 检查字段是否已存在
  db.all("PRAGMA table_info(vehicle_models)", (err, columns) => {
    if (err) {
      console.error('❌ 查询表结构失败:', err.message);
      db.close();
      return;
    }

    const hasStatusColumn = columns.some(col => col.name === 'status');
    const hasDeletedAtColumn = columns.some(col => col.name === 'deleted_at');

    // 检查是否需要添加status字段
    let fieldsToAdd = 0;
    let completedFields = 0;

    if (!hasStatusColumn) {
      fieldsToAdd++;
      db.run("ALTER TABLE vehicle_models ADD COLUMN status TEXT DEFAULT 'active'", (err) => {
        if (err) {
          console.error('❌ 添加status字段失败:', err.message);
        } else {
          console.log('✅ vehicle_models表已添加status字段');
          
          // 为所有现有车型设置默认状态
          db.run("UPDATE vehicle_models SET status = 'active'", (err) => {
            if (err) {
              console.error('❌ 更新现有车型状态失败:', err.message);
            } else {
              console.log('✅ 所有现有车型已设置为active状态');
            }
          });
        }
        
        completedFields++;
        if (completedFields >= fieldsToAdd) {
          console.log('🎉 vehicle_models表结构更新完成');
          db.close();
        }
      });
    }

    if (!hasDeletedAtColumn) {
      fieldsToAdd++;
      db.run("ALTER TABLE vehicle_models ADD COLUMN deleted_at DATETIME NULL", (err) => {
        if (err) {
          console.error('❌ 添加deleted_at字段失败:', err.message);
        } else {
          console.log('✅ vehicle_models表已添加deleted_at字段');
        }
        
        completedFields++;
        if (completedFields >= fieldsToAdd) {
          console.log('🎉 vehicle_models表结构更新完成');
          db.close();
        }
      });
    }

    if (fieldsToAdd === 0) {
      console.log('ℹ️ 所需字段已存在');
      db.close();
    }
  });
}

addStatusFieldToVehicleModels();