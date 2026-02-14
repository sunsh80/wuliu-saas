const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function updateTenantVehiclesTable() {
  const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🔧 开始更新tenant_vehicles表结构...\n');

  // 检查字段是否已存在
  db.all("PRAGMA table_info(tenant_vehicles)", (err, columns) => {
    if (err) {
      console.error('❌ 查询表结构失败:', err.message);
      db.close();
      return;
    }

    const hasVehicleModelId = columns.some(col => col.name === 'vehicle_model_id');

    if (!hasVehicleModelId) {
      console.log('📝 tenant_vehicles表缺少vehicle_model_id字段，正在添加...');
      
      // 添加vehicle_model_id字段
      db.run("ALTER TABLE tenant_vehicles ADD COLUMN vehicle_model_id INTEGER", (err) => {
        if (err) {
          console.error('❌ 添加vehicle_model_id字段失败:', err.message);
        } else {
          console.log('✅ tenant_vehicles表已添加vehicle_model_id字段');
        }
        
        console.log('🎉 tenant_vehicles表结构更新完成');
        db.close();
      });
    } else {
      console.log('ℹ️ tenant_vehicles表已存在vehicle_model_id字段');
      console.log('🎉 tenant_vehicles表结构已是最新');
      db.close();
    }
  });
}

updateTenantVehiclesTable();