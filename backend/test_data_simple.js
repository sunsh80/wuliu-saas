// test_data_simple.js - 简化的测试数据设置脚本
const { openDatabaseAndInitialize, getDb } = require('./db/index.js');
const bcrypt = require('bcryptjs');

async function setupTestData() {
  console.log('🚀 开始创建测试数据...');
  
  // 初始化数据库
  await openDatabaseAndInitialize();
  const db = getDb();
  
  try {
    // 获取现有的客户和承运商用户
    console.log('🔍 获取现有用户...');
    const carrierUsers = await db.all("SELECT id, username FROM users WHERE role = 'carrier' LIMIT 2");
    const customerUsers = await db.all("SELECT id, username FROM users WHERE role = 'customer' LIMIT 2");
    
    if (carrierUsers.length < 2) {
      console.log('⚠️  数据库中承运商用户不足2个，需要先创建...');
      // 创建2个承运商用户
      const carrier1PasswordHash = await bcrypt.hash('carrier123', 10);
      const carrier2PasswordHash = await bcrypt.hash('carrier456', 10);
      
      const tenant1 = await db.get("SELECT id FROM tenants WHERE name LIKE '%承运%' LIMIT 1");
      const tenant2 = await db.get("SELECT id FROM tenants WHERE name LIKE '%承运%' LIMIT 1 OFFSET 1");
      
      if (tenant1) {
        await db.run(
          `INSERT INTO users (username, email, phone, name, role, type, password_hash, user_type, tenant_id, is_active, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'), datetime('now'))`,
          ['test_carrier1', 'carrier1@test.com', '13900139001', '测试承运商1', 'carrier', 'carrier', carrier1PasswordHash, 'carrier', tenant1.id]
        );
      }
      
      if (tenant2) {
        await db.run(
          `INSERT INTO users (username, email, phone, name, role, type, password_hash, user_type, tenant_id, is_active, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'), datetime('now'))`,
          ['test_carrier2', 'carrier2@test.com', '13900139002', '测试承运商2', 'carrier', 'carrier', carrier2PasswordHash, 'carrier', tenant2.id]
        );
      }
      
      // 重新获取用户
      carrierUsers.push(...await db.all("SELECT id, username FROM users WHERE username LIKE 'test_carrier%'"));
    }
    
    if (customerUsers.length < 2) {
      console.log('⚠️  数据库中客户用户不足2个，需要先创建...');
      // 创建2个客户用户
      const customer1PasswordHash = await bcrypt.hash('customer123', 10);
      const customer2PasswordHash = await bcrypt.hash('customer456', 10);
      
      const tenant1 = await db.get("SELECT id FROM tenants WHERE name LIKE '%客户%' LIMIT 1");
      const tenant2 = await db.get("SELECT id FROM tenants WHERE name LIKE '%客户%' LIMIT 1 OFFSET 1");
      
      if (tenant1) {
        await db.run(
          `INSERT INTO users (username, email, phone, name, role, type, password_hash, user_type, tenant_id, is_active, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'), datetime('now'))`,
          ['test_customer1', 'customer1@test.com', '13800138001', '测试客户1', 'customer', 'customer', customer1PasswordHash, 'customer', tenant1.id]
        );
      }
      
      if (tenant2) {
        await db.run(
          `INSERT INTO users (username, email, phone, name, role, type, password_hash, user_type, tenant_id, is_active, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'), datetime('now'))`,
          ['test_customer2', 'customer2@test.com', '13800138002', '测试客户2', 'customer', 'customer', customer2PasswordHash, 'customer', tenant2.id]
        );
      }
      
      // 重新获取用户
      customerUsers.push(...await db.all("SELECT id, username FROM users WHERE username LIKE 'test_customer%'"));
    }
    
    console.log(`📋 找到 ${carrierUsers.length} 个承运商用户`);
    console.log(`📋 找到 ${customerUsers.length} 个客户用户`);
    
    // 6. 创建6个订单
    console.log('📝 创建6个测试订单...');
    
    if (customerUsers.length >= 2 && carrierUsers.length >= 2) {
      for (let i = 1; i <= 6; i++) {
        const customerId = customerUsers[(i - 1) % customerUsers.length].id; // 循环分配客户
        const carrierUserId = i <= 4 ? carrierUsers[0].id : carrierUsers[1].id; // 前4个给承运商1，后2个给承运商2
        
        // 根据数据库结构创建订单
        const result = await db.run(
          `INSERT INTO orders (
            customer_tenant_id, carrier_id, tenant_id, tracking_number, sender_info, receiver_info, 
            status, quote_price, quote_delivery_time, quote_remarks, quote_deadline,
            weight_kg, volume_m3, required_delivery_time, description, cargo_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            customerId, // customer_tenant_id (客户用户ID)
            i <= 2 ? null : carrierUserId, // 前2个订单未分配承运商，其余分配
            customerId, // tenant_id (客户用户ID)
            `ORD-TEST-${i.toString().padStart(3, '0')}`, // tracking_number (订单跟踪号)
            JSON.stringify({name: `发货人${i}`, phone: `1380013800${i}`}), // sender_info
            JSON.stringify({name: `收货人${i}`, phone: `1390013900${i}`}), // receiver_info
            i <= 2 ? 'pending_claim' : i <= 4 ? 'claimed' : i <= 6 ? 'awarded' : 'pending_claim', // status
            150 + i * 10, // quote_price
            new Date(Date.now() + 24 * (i + 1) * 60 * 60 * 1000).toISOString(), // quote_delivery_time
            `订单${i}的备注`, // quote_remarks
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // quote_deadline
            100 + i * 10, // weight_kg
            1.5 + i * 0.1, // volume_m3
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // required_delivery_time
            `订单${i}的描述`, // description
            ['家具家电', '装修建材', '办公用品', '快递包裹'][i % 4], // cargo_type
          ]
        );
        
        // 获取刚插入的订单ID
        const orderId = result.lastID;
        
        // 为已分配的订单创建报价
        if (i > 2) {
          await db.run(
            `INSERT INTO quotes (
              order_id, carrier_id, quote_price, quote_delivery_time, quote_remarks, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              orderId, // order_id (刚刚插入的订单的ID)
              carrierUserId, // carrier_id (用户ID)
              150 + i * 10, // quote_price
              new Date(Date.now() + 24 * (i + 1) * 60 * 60 * 1000).toISOString(), // quote_delivery_time
              `承运商${i > 4 ? 2 : 1}对订单${i}的报价` // quote_remarks
            ]
          );
        }
        
        console.log(`   - 已创建订单 ORD-TEST-${i.toString().padStart(3, '0')} (状态: ${i <= 2 ? 'pending_claim' : i <= 4 ? 'claimed' : 'awarded'})`);
      }
    }
    
    console.log('✅ 测试数据创建完成！');
    
    // 显示统计信息
    const stats = {
      users: await db.get("SELECT COUNT(*) as count FROM users").then(r => r.count),
      tenants: await db.get("SELECT COUNT(*) as count FROM tenants").then(r => r.count),
      orders: await db.get("SELECT COUNT(*) as count FROM orders").then(r => r.count),
      wallets: await db.get("SELECT COUNT(*) as count FROM wallets").then(r => r.count),
      quotes: await db.get("SELECT COUNT(*) as count FROM quotes").then(r => r.count)
    };
    
    console.log('\n📊 数据库统计:');
    console.log(`   - 用户: ${stats.users}`);
    console.log(`   - 租户: ${stats.tenants}`);
    console.log(`   - 订单: ${stats.orders}`);
    console.log(`   - 钱包: ${stats.wallets}`);
    console.log(`   - 报价: ${stats.quotes}`);
    
    // 显示新创建的订单
    console.log('\n📋 新创建的订单:');
    const newOrders = await db.all("SELECT * FROM orders WHERE tracking_number LIKE 'ORD-TEST-%' ORDER BY id DESC LIMIT 6");
    for (const order of newOrders) {
      console.log(`   - ${order.tracking_number}: 状态=${order.status}, 客户=${order.customer_tenant_id}${order.carrier_id ? `, 承运商=${order.carrier_id}` : ', 未分配承运商'}`);
    }
    
  } catch (error) {
    console.error('❌ 创建测试数据时出错:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则执行设置
if (require.main === module) {
  setupTestData()
    .then(() => {
      console.log('\n🎉 测试数据设置完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试数据设置失败:', error);
      process.exit(1);
    });
}

module.exports = { setupTestData };