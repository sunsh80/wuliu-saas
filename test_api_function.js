// 测试API处理函数
const { getDb } = require('./backend/db/index.js');

async function testApiFunction() {
  console.log('🔍 测试报表统计API处理函数...\n');
  
  const db = getDb();

  try {
    // 获取订单统计
    console.log('📊 获取订单统计...');
    const totalOrdersResult = await db.get('SELECT COUNT(*) as count FROM orders');
    console.log('  总订单数:', totalOrdersResult);

    const completedOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'");
    console.log('  已完成订单数:', completedOrdersResult);

    const inTransitOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'in_transit' OR status = 'dispatched'");
    console.log('  运输中订单数:', inTransitOrdersResult);

    const pendingOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'pending_claim', 'available')");
    console.log('  待处理订单数:', pendingOrdersResult);

    const processingOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('claimed', 'quoted', 'awarded')");
    console.log('  处理中订单数:', processingOrdersResult);

    const cancelledOrdersResult = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'");
    console.log('  已取消订单数:', cancelledOrdersResult);

    // 获取客户统计
    console.log('\n👥 获取客户统计...');
    const totalCustomersResult = await db.get('SELECT COUNT(*) as count FROM tenants WHERE JSON_EXTRACT(roles, \'$[0]\') = \'customer\' OR JSON_EXTRACT(roles, \'$[1]\') = \'customer\'');
    console.log('  客户总数:', totalCustomersResult);

    // 获取最近订单
    console.log('\n📋 获取最近订单...');
    const recentOrders = await db.all(`
      SELECT
        o.id,
        o.tracking_number,
        o.sender_info,
        o.receiver_info,
        o.status,
        o.created_at,
        o.weight_kg,
        t.name as customer_tenant_name
      FROM orders o
      LEFT JOIN tenants t ON o.customer_tenant_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    console.log('  最近订单数量:', recentOrders.length);
    console.log('  最近订单示例:', recentOrders[0] || '无订单');

    console.log('\n✅ API函数测试完成，没有发现明显错误');
  } catch (error) {
    console.error('❌ API函数测试失败:', error.message);
    console.error('   位置:', error.stack);
  }
}

testApiFunction();