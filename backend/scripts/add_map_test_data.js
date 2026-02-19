// backend/scripts/add_map_test_data.js
const { getDb } = require('../db/index');

async function addMapTestData() {
  try {
    const db = getDb();

    console.log('Adding stop points test data...');
    
    // 添加一些停靠点测试数据
    const stopPoints = [
      { name: '北京南站', address: '北京市丰台区北京南站', lat: 39.8652, lng: 116.3972, type: 'commercial', region: 'beijing', capacity: 50 },
      { name: '上海虹桥站', address: '上海市闵行区申虹路', lat: 31.1950, lng: 121.3285, type: 'commercial', region: 'shanghai', capacity: 80 },
      { name: '广州南站', address: '广东省佛山市顺德区林岳大道', lat: 22.9888, lng: 113.2726, type: 'commercial', region: 'guangzhou', capacity: 100 },
      { name: '深圳北站', address: '深圳市龙华区民治街道', lat: 22.6078, lng: 114.0283, type: 'commercial', region: 'shenzhen', capacity: 70 },
      { name: '成都东站', address: '四川省成都市成华区邛崃山路', lat: 30.6316, lng: 104.1515, type: 'commercial', region: 'chengdu', capacity: 60 }
    ];

    for (const sp of stopPoints) {
      await db.run(
        `INSERT OR IGNORE INTO stop_points (name, address, lat, lng, type, region, capacity, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sp.name, sp.address, sp.lat, sp.lng, sp.type, sp.region, sp.capacity, 'active']
      );
    }
    console.log('✓ Stop points test data added');

    console.log('Adding vehicle tracking test data...');
    
    // 添加一些车辆跟踪测试数据
    const vehicles = [
      { id: 'V001', lat: 39.9042, lng: 116.4074, status: 'online', battery: 85 },
      { id: 'V002', lat: 31.2304, lng: 121.4737, status: 'online', battery: 70 },
      { id: 'V003', lat: 23.1291, lng: 113.2644, status: 'offline', battery: 45 }
    ];

    for (const v of vehicles) {
      await db.run(
        `INSERT OR REPLACE INTO vehicle_tracking (vehicle_id, lat, lng, status, battery) 
         VALUES (?, ?, ?, ?, ?)`,
        [v.id, v.lat, v.lng, v.status, v.battery]
      );
    }
    console.log('✓ Vehicle tracking test data added');

    console.log('Adding vehicle positions test data...');
    
    // 添加一些车辆位置历史数据
    const positions = [
      { vehicle_id: 'V001', lat: 39.9042, lng: 116.4074, timestamp: Date.now() - 3600000, battery: 85, speed: 40, heading: 90 },
      { vehicle_id: 'V001', lat: 39.9142, lng: 116.4174, timestamp: Date.now() - 1800000, battery: 83, speed: 45, heading: 95 },
      { vehicle_id: 'V001', lat: 39.9242, lng: 116.4274, timestamp: Date.now() - 600000, battery: 82, speed: 50, heading: 100 },
      { vehicle_id: 'V002', lat: 31.2304, lng: 121.4737, timestamp: Date.now() - 3600000, battery: 70, speed: 35, heading: 180 },
      { vehicle_id: 'V002', lat: 31.2404, lng: 121.4837, timestamp: Date.now() - 1800000, battery: 68, speed: 40, heading: 185 },
      { vehicle_id: 'V002', lat: 31.2504, lng: 121.4937, timestamp: Date.now() - 600000, battery: 67, speed: 42, heading: 190 }
    ];

    for (const pos of positions) {
      await db.run(
        `INSERT INTO vehicle_positions (vehicle_id, lat, lng, timestamp, battery, speed, heading, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [pos.vehicle_id, pos.lat, pos.lng, pos.timestamp, pos.battery, pos.speed, pos.heading, 'online']
      );
    }
    console.log('✓ Vehicle positions test data added');

    console.log('\n✓ All map-related test data have been added successfully!');
  } catch (error) {
    console.error('❌ Error adding map test data:', error);
  }
}

// 执行函数
addMapTestData().then(() => {
  console.log('Test data script completed.');
}).catch(err => {
  console.error('Test data script failed:', err);
});