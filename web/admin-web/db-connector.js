// 数据库连接配置
const mysql = require('mysql2/promise');

// 数据库配置 - 请根据实际情况修改
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'your_password',
    database: process.env.DB_NAME || 'logistics_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        console.log('正在测试数据库连接...');
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功！');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 获取所有订单数据
async function getAllOrders() {
    try {
        const [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
        console.log(`✅ 成功获取 ${rows.length} 条订单数据`);
        return rows;
    } catch (error) {
        console.error('❌ 获取订单数据失败:', error.message);
        throw error;
    }
}

// 获取所有租户数据
async function getAllTenants() {
    try {
        const [rows] = await pool.execute('SELECT * FROM tenants ORDER BY created_at DESC');
        console.log(`✅ 成功获取 ${rows.length} 个租户数据`);
        return rows;
    } catch (error) {
        console.error('❌ 获取租户数据失败:', error.message);
        throw error;
    }
}

// 获取待审核租户数据
async function getPendingTenants() {
    try {
        const [rows] = await pool.execute('SELECT * FROM tenants WHERE status = "pending" ORDER BY created_at DESC');
        console.log(`✅ 成功获取 ${rows.length} 个待审核租户数据`);
        return rows;
    } catch (error) {
        console.error('❌ 获取待审核租户数据失败:', error.message);
        throw error;
    }
}

// 获取订单统计信息
async function getOrderStats() {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('created', 'pending_claim', 'claimed', 'quoted') THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders
            FROM orders
        `);
        console.log('✅ 成功获取订单统计信息');
        return stats[0];
    } catch (error) {
        console.error('❌ 获取订单统计信息失败:', error.message);
        throw error;
    }
}

// 获取租户统计信息
async function getTenantStats() {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_tenants,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tenants,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_tenants,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_tenants
            FROM tenants
        `);
        console.log('✅ 成功获取租户统计信息');
        return stats[0];
    } catch (error) {
        console.error('❌ 获取租户统计信息失败:', error.message);
        throw error;
    }
}

// 关闭数据库连接池
async function closePool() {
    try {
        await pool.end();
        console.log('✅ 数据库连接池已关闭');
    } catch (error) {
        console.error('❌ 关闭数据库连接池失败:', error.message);
    }
}

// 导出数据库操作函数
module.exports = {
    testConnection,
    getAllOrders,
    getAllTenants,
    getPendingTenants,
    getOrderStats,
    getTenantStats,
    closePool
};