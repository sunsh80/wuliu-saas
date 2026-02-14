const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在连接到数据库:', dbPath);

// 添加新石器L4电动车型
async function addNewStoneL4ElectricVehicle() {
  return new Promise((resolve, reject) => {
    console.log('🚚 添加新石器L4电动测试车型到数据库...');
    
    const newStoneModel = {
      brand: '新石器',
      manufacturer: '新石器慧通（北京）科技有限公司',
      model_name: '无人配送车L4',
      production_year: '2024',
      vehicle_type: '无人配送车',
      battery_manufacturer: '宁德时代',
      battery_model: 'LFP',
      autonomous_level: 'L4',
      max_load_capacity: 300, // kg
      max_volume: 2.5, // m³
      fuel_type: '电动',
      engine_displacement: null,
      dimensions_length: 2.5,
      dimensions_width: 1.5,
      dimensions_height: 1.8,
      wheelbase: 1.8,
      max_speed: 45, // km/h
      fuel_efficiency: 15 // kWh/100km
    };

    // 检查是否已存在该车型
    const checkSql = "SELECT id FROM vehicle_models WHERE brand = ? AND model_name = ?";
    db.get(checkSql, [newStoneModel.brand, newStoneModel.model_name], (err, row) => {
      if (err) {
        console.error('查询车型时出错:', err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log(`⚠️ 车型 ${newStoneModel.brand} ${newStoneModel.model_name} 已存在，ID: ${row.id}`);
        resolve(row.id);
      } else {
        // 插入新车型
        const insertSql = `
          INSERT INTO vehicle_models (
            brand, manufacturer, model_name, production_year, vehicle_type,
            battery_manufacturer, battery_model, autonomous_level,
            max_load_capacity, max_volume, fuel_type, engine_displacement,
            dimensions_length, dimensions_width, dimensions_height, wheelbase,
            max_speed, fuel_efficiency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          newStoneModel.brand, 
          newStoneModel.manufacturer, 
          newStoneModel.model_name, 
          newStoneModel.production_year, 
          newStoneModel.vehicle_type,
          newStoneModel.battery_manufacturer, 
          newStoneModel.battery_model, 
          newStoneModel.autonomous_level,
          newStoneModel.max_load_capacity, 
          newStoneModel.max_volume, 
          newStoneModel.fuel_type, 
          newStoneModel.engine_displacement,
          newStoneModel.dimensions_length, 
          newStoneModel.dimensions_width, 
          newStoneModel.dimensions_height, 
          newStoneModel.wheelbase,
          newStoneModel.max_speed, 
          newStoneModel.fuel_efficiency
        ];
        
        db.run(insertSql, values, function(err) {
          if (err) {
            console.error('插入车型时出错:', err.message);
            reject(err);
          } else {
            console.log(`✅ 新石器L4电动车型已成功添加，ID: ${this.lastID}`);
            console.log(`  - 品牌: ${newStoneModel.brand}`);
            console.log(`  - 型号: ${newStoneModel.model_name}`);
            console.log(`  - 自动驾驶等级: ${newStoneModel.autonomous_level}`);
            console.log(`  - 最大载重: ${newStoneModel.max_load_capacity}kg`);
            console.log(`  - 最大容积: ${newStoneModel.max_volume}m³`);
            console.log(`  - 电池厂商: ${newStoneModel.battery_manufacturer}`);
            resolve(this.lastID);
          }
        });
      }
    });
  });
}

// 添加一个新石器的承运商租户
async function addNewStoneCarrier() {
  return new Promise((resolve, reject) => {
    console.log('🚛 添加新石器承运商到数据库...');
    
    // 检查是否已存在该承运商
    const checkSql = "SELECT id FROM tenants WHERE name = ?";
    const carrierName = '新石器慧通';
    db.get(checkSql, [carrierName], (err, row) => {
      if (err) {
        console.error('查询承运商时出错:', err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log(`⚠️ 承运商 ${carrierName} 已存在，ID: ${row.id}`);
        resolve(row.id);
      } else {
        // 插入新承运商
        const insertSql = `
          INSERT INTO tenants (
            name, contact_person, contact_phone, email, password_hash, roles, address,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        // 使用bcrypt生成密码哈希
        const bcrypt = require('bcryptjs');
        const passwordHash = bcrypt.hashSync('newstone123', 10);
        
        const values = [
          carrierName,
          '新石器技术负责人',
          '13800138000',
          'contact@newstone.ai',
          passwordHash,
          JSON.stringify(['carrier']),
          '北京市海淀区中关村软件园'
        ];
        
        db.run(insertSql, values, function(err) {
          if (err) {
            console.error('插入承运商时出错:', err.message);
            reject(err);
          } else {
            console.log(`✅ 新石器承运商已成功添加，ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        });
      }
    });
  });
}

// 添加新石器承运商的用户账户
async function addNewStoneCarrierUser(tenantId) {
  return new Promise((resolve, reject) => {
    console.log('👤 添加新石器承运商用户到数据库...');
    
    // 检查是否已存在该用户
    const checkSql = "SELECT id FROM users WHERE email = ?";
    const email = 'contact@newstone.ai';
    db.get(checkSql, [email], (err, row) => {
      if (err) {
        console.error('查询用户时出错:', err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log(`⚠️ 用户 ${email} 已存在，ID: ${row.id}`);
        resolve(row.id);
      } else {
        // 插入新用户
        const insertSql = `
          INSERT INTO users (
            username, email, phone, name, role, roles, type, password_hash, user_type, tenant_id, is_active, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // 使用bcrypt生成密码哈希
        const bcrypt = require('bcryptjs');
        const passwordHash = bcrypt.hashSync('newstone123', 10);
        
        const values = [
          'newstone',
          email,
          '13800138000',
          '新石器技术负责人',
          'carrier',
          JSON.stringify(['carrier']),
          'tenant',
          passwordHash,
          'tenant_user',
          tenantId,
          1,
          'active'
        ];
        
        db.run(insertSql, values, function(err) {
          if (err) {
            console.error('插入用户时出错:', err.message);
            reject(err);
          } else {
            console.log(`✅ 新石器承运商用户已成功添加，ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        });
      }
    });
  });
}

// 主函数
async function main() {
  try {
    console.log('\n🚀 开始添加新石器L4电动测试车型...\n');
    
    // 添加车型
    const vehicleModelId = await addNewStoneL4ElectricVehicle();
    
    // 添加承运商
    const carrierTenantId = await addNewStoneCarrier();
    
    // 添加承运商用户
    await addNewStoneCarrierUser(carrierTenantId);
    
    console.log('\n✅ 所有新石器相关数据已成功添加到数据库！');
    console.log(`\n📋 测试信息:`);
    console.log(`   - 车型ID: ${vehicleModelId}`);
    console.log(`   - 承运商ID: ${carrierTenantId}`);
    console.log(`   - 登录邮箱: contact@newstone.ai`);
    console.log(`   - 登录密码: newstone123`);
    console.log(`\n🔧 要使用承运商添加车辆功能，请:`);
    console.log(`   1. 启动后端服务 (cd backend && npm start)`);
    console.log(`   2. 登录承运商账户 (邮箱: contact@newstone.ai, 密码: newstone123)`);
    console.log(`   3. 访问车辆管理页面添加车辆，选择新石器L4电动车型`);
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
    });
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
    });
  }
}

main();