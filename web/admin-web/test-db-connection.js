// 数据库连接测试脚本
const { 
    testConnection, 
    getAllOrders, 
    getAllTenants, 
    getPendingTenants, 
    getOrderStats, 
    getTenantStats,
    closePool 
} = require('./db-connector');

async function runDatabaseTest() {
    console.log('🔍 开始数据库连接测试...\n');
    
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log('❌ 无法连接到数据库，测试终止。');
        return;
    }
    
    console.log('\n📊 开始获取数据...\n');
    
    try {
        // 获取订单统计信息
        console.log('📋 获取订单统计信息...');
        const orderStats = await getOrderStats();
        console.log(`  总订单数: ${orderStats.total_orders}`);
        console.log(`  待处理订单: ${orderStats.pending_orders}`);
        console.log(`  运输中订单: ${orderStats.in_transit_orders}`);
        console.log(`  已完成订单: ${orderStats.completed_orders}\n`);
        
        // 获取租户统计信息
        console.log('🏢 获取租户统计信息...');
        const tenantStats = await getTenantStats();
        console.log(`  总租户数: ${tenantStats.total_tenants}`);
        console.log(`  待审核租户: ${tenantStats.pending_tenants}`);
        console.log(`  已批准租户: ${tenantStats.approved_tenants}`);
        console.log(`  活跃租户: ${tenantStats.active_tenants}\n`);
        
        // 获取最近的订单数据
        console.log('📦 获取最近订单数据...');
        const orders = await getAllOrders();
        if (orders.length > 0) {
            console.log(`  显示前 ${Math.min(5, orders.length)} 条订单:`);
            orders.slice(0, 5).forEach((order, index) => {
                console.log(`    ${index + 1}. 订单号: ${order.tracking_number || order.id}, 状态: ${order.status}, 创建时间: ${order.created_at}`);
            });
        } else {
            console.log('  ❌ 数据库中暂无订单数据');
        }
        console.log('');
        
        // 获取租户数据
        console.log('👥 获取租户数据...');
        const tenants = await getAllTenants();
        if (tenants.length > 0) {
            console.log(`  显示前 ${Math.min(5, tenants.length)} 个租户:`);
            tenants.slice(0, 5).forEach((tenant, index) => {
                console.log(`    ${index + 1}. 租户名: ${tenant.name}, 联系人: ${tenant.contact_person}, 状态: ${tenant.status}`);
            });
        } else {
            console.log('  ❌ 数据库中暂无租户数据');
        }
        console.log('');
        
        // 获取待审核租户
        console.log('⏳ 获取待审核租户...');
        const pendingTenants = await getPendingTenants();
        if (pendingTenants.length > 0) {
            console.log(`  找到 ${pendingTenants.length} 个待审核租户:`);
            pendingTenants.forEach((tenant, index) => {
                console.log(`    ${index + 1}. 租户名: ${tenant.name}, 申请时间: ${tenant.created_at}`);
            });
        } else {
            console.log('  ✅ 暂无待审核租户');
        }
        console.log('');
        
        console.log('🎉 数据库连接测试完成！所有数据获取成功。');
        
    } catch (error) {
        console.error('❌ 数据库操作失败:', error.message);
    } finally {
        // 关闭数据库连接池
        await closePool();
    }
}

// 运行测试
if (require.main === module) {
    runDatabaseTest();
}

module.exports = { runDatabaseTest };