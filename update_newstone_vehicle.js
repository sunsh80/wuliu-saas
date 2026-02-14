/**
 * 更新和扩展新石器车型信息
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

// 定义完整的新石器车型数据
const newStoneModels = [
  {
    brand: '新石器',
    manufacturer: '新石器慧通（北京）科技有限公司',
    model_name: '无人配送车-A1',
    production_year: '2023',
    vehicle_type: '无人配送车',
    battery_manufacturer: '宁德时代',
    battery_model: 'NCM811',
    autonomous_level: 'L4',
    max_load_capacity: 300, // 最大载重(kg)
    max_volume: 2.5, // 最大容量(m³)
    fuel_type: '电动',
    engine_displacement: null,
    dimensions_length: 2.5, // 长度(m)
    dimensions_width: 1.5, // 宽度(m)
    dimensions_height: 1.8, // 高度(m)
    wheelbase: 1.8, // 轴距(m)
    max_speed: 45, // 最高速度(km/h)
    fuel_efficiency: 15 // 能耗(kWh/100km)
  },
  {
    brand: '新石器',
    manufacturer: '新石器慧通（北京）科技有限公司',
    model_name: '无人配送车-A2',
    production_year: '2024',
    vehicle_type: '无人配送车',
    battery_manufacturer: '比亚迪',
    battery_model: 'LFP',
    autonomous_level: 'L4',
    max_load_capacity: 500, // 最大载重(kg)
    max_volume: 4.0, // 最大容量(m³)
    fuel_type: '电动',
    engine_displacement: null,
    dimensions_length: 3.2, // 长度(m)
    dimensions_width: 1.7, // 宽度(m)
    dimensions_height: 1.9, // 高度(m)
    wheelbase: 2.2, // 轴距(m)
    max_speed: 50, // 最高速度(km/h)
    fuel_efficiency: 18 // 能耗(kWh/100km)
  },
  {
    brand: '新石器',
    manufacturer: '新石器慧通（北京）科技有限公司',
    model_name: '无人配送车-Pro',
    production_year: '2024',
    vehicle_type: '无人配送车',
    battery_manufacturer: '宁德时代',
    battery_model: 'NCM811',
    autonomous_level: 'L5',
    max_load_capacity: 800, // 最大载重(kg)
    max_volume: 6.0, // 最大容量(m³)
    fuel_type: '电动',
    engine_displacement: null,
    dimensions_length: 4.2, // 长度(m)
    dimensions_width: 1.9, // 宽度(m)
    dimensions_height: 2.1, // 高度(m)
    wheelbase: 2.8, // 轴距(m)
    max_speed: 60, // 最高速度(km/h)
    fuel_efficiency: 20 // 能耗(kWh/100km)
  }
];

db.serialize(() => {
  console.log('开始更新新石器车型信息...');
  
  // 检查是否已存在新石器车型
  db.all("SELECT * FROM vehicle_models WHERE brand = '新石器'", (err, rows) => {
    if (rows && rows.length > 0) {
      console.log(`发现 ${rows.length} 个已存在的新石器车型:`);
      rows.forEach(row => {
        console.log(`  - ${row.model_name} (${row.manufacturer})`);
      });
      
      // 如果已存在新石器车型，询问是否要更新
      console.log('\n已存在新石器车型，跳过添加步骤...');
    } else {
      console.log('未发现新石器车型，开始添加...');
      
      // 添加新石器车型
      newStoneModels.forEach(model => {
        const stmt = db.prepare(`
          INSERT INTO vehicle_models (
            brand, manufacturer, model_name, production_year, vehicle_type,
            battery_manufacturer, battery_model, autonomous_level,
            max_load_capacity, max_volume, fuel_type, engine_displacement,
            dimensions_length, dimensions_width, dimensions_height, wheelbase,
            max_speed, fuel_efficiency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          model.brand, model.manufacturer, model.model_name, model.production_year, model.vehicle_type,
          model.battery_manufacturer, model.battery_model, model.autonomous_level,
          model.max_load_capacity, model.max_volume, model.fuel_type, model.engine_displacement,
          model.dimensions_length, model.dimensions_width, model.dimensions_height, model.wheelbase,
          model.max_speed, model.fuel_efficiency
        ]);
        
        stmt.finalize();
        console.log(`已添加新石器车型: ${model.model_name}`);
      });
    }
    
    // 显示所有新石器车型的详细信息
    console.log('\n=== 新石器车型详细信息 ===');
    db.each("SELECT * FROM vehicle_models WHERE brand = '新石器'", (err, row) => {
      if (row) {
        console.log(`\n车型: ${row.model_name}`);
        console.log(`  品牌: ${row.brand}`);
        console.log(`  制造商: ${row.manufacturer}`);
        console.log(`  类型: ${row.vehicle_type}`);
        console.log(`  生产年份: ${row.production_year}`);
        console.log(`  自动驾驶级别: ${row.autonomous_level}`);
        console.log(`  最大载重: ${row.max_load_capacity}kg`);
        console.log(`  最大容量: ${row.max_volume}m³`);
        console.log(`  电池厂商: ${row.battery_manufacturer}`);
        console.log(`  电池型号: ${row.battery_model}`);
        console.log(`  燃料类型: ${row.fuel_type}`);
        console.log(`  尺寸 (长x宽x高): ${row.dimensions_length}m x ${row.dimensions_width}m x ${row.dimensions_height}m`);
        console.log(`  最高速度: ${row.max_speed}km/h`);
        console.log(`  能耗: ${row.fuel_efficiency}kWh/100km`);
      }
    }, () => {
      console.log('\n新石器车型信息更新完成！');
      db.close();
    });
  });
});