// backend/scripts/add_shenyang_stop_points.js
// 添加沈阳测试停靠点数据

const { openDatabaseAndInitialize } = require('../db/index');

async function addShenyangStopPoints() {
  try {
    await openDatabaseAndInitialize();
    const db = require('../db/index').getDb();
    
    console.log('🚀 开始添加沈阳测试停靠点...\n');
    
    // 沈阳测试停靠点数据（真实坐标）
    const shenyangStopPoints = [
      {
        name: '沈阳北站',
        address: '辽宁省沈阳市沈河区北站路 117 号',
        lat: 41.832,
        lng: 123.431,
        type: 'commercial',
        region: '沈阳',
        capacity: 10,
        description: '沈阳北站交通枢纽，人流量大'
      },
      {
        name: '太原街万达广场',
        address: '辽宁省沈阳市和平区太原街商圈中华路 9 号',
        lat: 41.793,
        lng: 123.408,
        type: 'commercial',
        region: '沈阳',
        capacity: 8,
        description: '太原街商业中心，购物人流密集'
      },
      {
        name: '中街步行街',
        address: '辽宁省沈阳市沈河区中街路 100 号',
        lat: 41.805,
        lng: 123.455,
        type: 'commercial',
        region: '沈阳',
        capacity: 12,
        description: '沈阳最繁华的商业步行街'
      },
      {
        name: '沈阳站',
        address: '辽宁省沈阳市和平区胜利南街 2 号',
        lat: 41.798,
        lng: 123.395,
        type: 'commercial',
        region: '沈阳',
        capacity: 15,
        description: '沈阳站交通枢纽'
      },
      {
        name: '五爱市场',
        address: '辽宁省沈阳市沈河区五爱街 58 号',
        lat: 41.785,
        lng: 123.465,
        type: 'commercial',
        region: '沈阳',
        capacity: 20,
        description: '东北著名批发市场，物流需求大'
      },
      {
        name: '华润万象城',
        address: '辽宁省沈阳市和平区青年大街 288 号',
        lat: 41.776,
        lng: 123.434,
        type: 'commercial',
        region: '沈阳',
        capacity: 10,
        description: '高端购物中心'
      },
      {
        name: '龙之梦购物中心',
        address: '辽宁省沈阳市大东区滂江街 22 号',
        lat: 41.815,
        lng: 123.485,
        type: 'commercial',
        region: '沈阳',
        capacity: 8,
        description: '大东区大型购物中心'
      },
      {
        name: '铁西万达广场',
        address: '辽宁省沈阳市铁西区兴华南街 58 号',
        lat: 41.755,
        lng: 123.380,
        type: 'commercial',
        region: '沈阳',
        capacity: 10,
        description: '铁西区商业中心'
      },
      {
        name: '奥体中心',
        address: '辽宁省沈阳市浑南区营盘北街 8 号',
        lat: 41.735,
        lng: 123.455,
        type: 'other',
        region: '沈阳',
        capacity: 15,
        description: '浑南奥体中心，大型活动场所'
      },
      {
        name: '沈阳航空航天大学',
        address: '辽宁省沈阳市沈北新区道义南大街 37 号',
        lat: 41.925,
        lng: 123.405,
        type: 'residential',
        region: '沈阳',
        capacity: 5,
        description: '高校区域，学生快递需求大'
      }
    ];
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const sp of shenyangStopPoints) {
      // 检查是否已存在
      const existing = await db.get(
        'SELECT id FROM stop_points WHERE name = ? AND region = ?',
        [sp.name, sp.region]
      );
      
      if (existing) {
        console.log(`⚠️  跳过：${sp.name}（已存在）`);
        skippedCount++;
        continue;
      }
      
      // 插入数据
      await db.run(
        `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status, approval_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'approved')`,
        [sp.name, sp.address, sp.lat, sp.lng, sp.type, sp.region, sp.capacity, sp.description]
      );
      
      console.log(`✅ 已添加：${sp.name} (${sp.lat}, ${sp.lng})`);
      insertedCount++;
    }
    
    console.log('\n=================================');
    console.log('✅ 沈阳测试停靠点添加完成！');
    console.log(`   - 新增：${insertedCount} 个`);
    console.log(`   - 跳过：${skippedCount} 个`);
    console.log('=================================\n');
    
    // 验证添加结果
    const result = await db.get('SELECT COUNT(*) as count FROM stop_points WHERE region = "沈阳"');
    console.log(`📊 当前沈阳地区停靠点总数：${result.count} 个`);
    
    // 查询所有已审批的停靠点
    const approvedPoints = await db.all(
      "SELECT id, name, region, lat, lng FROM stop_points WHERE approval_status = 'approved' ORDER BY region, id"
    );
    
    console.log('\n📍 所有已审批停靠点列表：');
    approvedPoints.forEach(point => {
      console.log(`   ${point.id}. ${point.name} (${point.region}) - [${point.lat}, ${point.lng}]`);
    });
    
  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
  }
}

// 执行脚本
addShenyangStopPoints().then(() => {
  console.log('\n✅ 脚本执行完成');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 脚本执行失败:', err);
  process.exit(1);
});
