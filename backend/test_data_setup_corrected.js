// test_data_setup_corrected.js - 修正后的测试数据设置脚本
const { openDatabaseAndInitialize, getDb } = require('./db/index.js');
const bcrypt = require('bcryptjs');

async function setupTestData() {
  console.log('🚀 开始创建测试数据...');
  
  // 初始化数据库
  await openDatabaseAndInitialize();
  const db = getDb();
  
  try {
    // 1. 创建管理员用户
    console.log('📝 创建管理员用户...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await db.run(
      `INSERT OR IGNORE INTO users (username, email, phone, name, role, type, password_hash, user_type, is_active, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', datetime('now'), datetime('now'))`,
      ['admin', 'admin@wuliu.com', '13800138000', '系统管理员', 'admin', 'admin', adminPasswordHash, 'admin']
    );
    
    // 2. 创建2个客户租户
    console.log('📝 创建客户租户...');
    const customer1PasswordHash = await bcrypt.hash('customer123', 10);
    const customer2PasswordHash = await bcrypt.hash('customer456', 10);
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['客户租户1', '客户一', '13800138001', 'customer1@wuliu.com', customer1PasswordHash, '["customer"]', 'approved']
    );
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['客户租户2', '客户二', '13800138002', 'customer2@wuliu.com', customer2PasswordHash, '["customer"]', 'approved']
    );
    
    // 3. 创建2个承运商租户
    console.log('📝 创建承运商租户...');
    const carrier1PasswordHash = await bcrypt.hash('carrier123', 10);
    const carrier2PasswordHash = await bcrypt.hash('carrier456', 10);
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['承运商租户1', '承运商一', '13900139001', 'carrier1@wuliu.com', carrier1PasswordHash, 
       '["carrier"]', 'approved', 200, 5000, 30, 2.5]
    );
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['承运商租户2', '承运商二', '13900139002', 'carrier2@wuliu.com', carrier2PasswordHash, 
       '["carrier"]', 'approved', 150, 3000, 20, 3.0]
    );
    
    // 4. 创建6个订单
    console.log('📝 创建订单...');
    const customers = await db.all("SELECT id FROM tenants WHERE name LIKE '%客户%'");
    const carriers = await db.all("SELECT id FROM tenants WHERE name LIKE '%承运%'");
    
    if (customers.length >= 2 && carriers.length >= 2) {
      for (let i = 1; i <= 6; i++) {
        const customerId = customers[(i - 1) % customers.length].id; // 循环分配客户
        const carrierId = i <= 4 ? carriers[0].id : carriers[1].id; // 前4个给承运商1，后2个给承运商2
        
        // 根据数据库结构创建订单
        await db.run(
          `INSERT OR IGNORE INTO orders (
            customer_tenant_id, carrier_id, tenant_id, tracking_number, sender_info, receiver_info, 
            status, quote_price, quote_delivery_time, quote_remarks, quote_deadline,
            weight_kg, volume_m3, required_delivery_time, description, cargo_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            customerId, // customer_tenant_id
            i <= 2 ? null : carrierId, // 前2个订单未分配承运商，其余分配
            customerId, // tenant_id (客户租户ID)
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
        
        // 为已分配的订单创建报价
        if (i > 2) {
          await db.run(
            `INSERT OR IGNORE INTO quotes (
              order_id, carrier_id, quote_price, quote_delivery_time, quote_remarks, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              `ORD-TEST-${i.toString().padStart(3, '0')}`, // order_id (跟踪号)
              carrierId, // carrier_id
              150 + i * 10, // quote_price
              new Date(Date.now() + 24 * (i + 1) * 60 * 60 * 1000).toISOString(), // quote_delivery_time
              `承运商${i > 4 ? 2 : 1}对订单${i}的报价` // quote_remarks
            ]
          );
        }
      }
    }
    
    // 5. 创建钱包记录
    console.log('💰 创建钱包记录...');
    const tenants = await db.all("SELECT id, name FROM tenants");
    for (const tenant of tenants) {
      // 为客户创建钱包
      if (tenant.name.includes('客户')) {
        await db.run(
          `INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          ['customer', tenant.id, 5000.00, 0.00, 'active', 'CNY']
        );
      } 
      // 为承运商创建钱包
      else if (tenant.name.includes('承运')) {
        await db.run(
          `INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          ['carrier', tenant.id, 3000.00, 0.00, 'active', 'CNY']
        );
      }
    }
    
    // 创建平台钱包
    await db.run(
      `INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['platform', 1, 10000.00, 0.00, 'active', 'CNY']
    );
    
    console.log('✅ 测试数据创建完成！');
    console.log('📋 创建的测试数据:');
    console.log('   - 1个管理员用户');
    console.log('   - 2个客户租户 (客户租户1, 客户租户2)');
    console.log('   - 2个承运商租户 (承运商租户1, 承运商租户2)');
    console.log('   - 6个订单 (ORD-TEST-001 到 ORD-TEST-006)');
    console.log('   - 相关钱包记录');
    
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