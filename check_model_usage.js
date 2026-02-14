const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.resolve(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中车型和车辆的关联关系...\n');

// 查询新创建的车型
db.get('SELECT * FROM vehicle_models WHERE id = 12', (err, model) => {
  if (err) {
    console.error('❌ 查询车型失败:', err.message);
    db.close();
    return;
  }

  if (model) {
    console.log('✅ 找到车型ID 12:');
    console.log(`   - 品牌: ${model.brand}`);
    console.log(`   - 型号: ${model.model_name}`);
    console.log(`   - 制造商: ${model.manufacturer}\n`);
  } else {
    console.log('❌ 未找到车型ID 12\n');
  }

  // 检查是否有车辆使用了这个车型
  db.get('SELECT COUNT(*) as count FROM tenant_vehicles WHERE vehicle_model_id = 12', (err, result) => {
    if (err) {
      console.error('❌ 查询车辆关联失败:', err.message);
      db.close();
      return;
    }

    console.log(`📊 使用车型ID 12的车辆数量: ${result.count}`);
    
    if (result.count > 0) {
      console.log('🔍 查询具体使用该车型的车辆:');
      db.all('SELECT id, plate_number, tenant_id FROM tenant_vehicles WHERE vehicle_model_id = 12', (err, vehicles) => {
        if (err) {
          console.error('❌ 查询具体车辆失败:', err.message);
        } else {
          vehicles.forEach(vehicle => {
            console.log(`   - 车辆ID: ${vehicle.id}, 车牌号: ${vehicle.plate_number}, 承运商ID: ${vehicle.tenant_id}`);
          });
        }
        db.close();
      });
    } else {
      console.log('✅ 该车型未被任何车辆使用，应该可以删除');
      db.close();
    }
  });
});