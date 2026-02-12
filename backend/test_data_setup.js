// test_data_setup.js - 创建测试数据脚本
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
      `INSERT OR IGNORE INTO users (username, email, password_hash, role, type, name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['admin', 'admin@wuliu.com', adminPasswordHash, 'admin', 'admin', '系统管理员']
    );
    
    // 2. 创建2个客户租户
    console.log('📝 创建客户租户...');
    const customer1PasswordHash = await bcrypt.hash('customer123', 10);
    const customer2PasswordHash = await bcrypt.hash('customer456', 10);
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['客户租户1', '客户一', '13800138001', 'customer1@wuliu.com', customer1PasswordHash, JSON.stringify(['customer']), 'approved']
    );
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['客户租户2', '客户二', '13800138002', 'customer2@wuliu.com', customer2PasswordHash, JSON.stringify(['customer']), 'approved']
    );
    
    // 3. 创建2个承运商租户
    console.log('📝 创建承运商租户...');
    const carrier1PasswordHash = await bcrypt.hash('carrier123', 10);
    const carrier2PasswordHash = await bcrypt.hash('carrier456', 10);
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['承运商租户1', '承运商一', '13900139001', 'carrier1@wuliu.com', carrier1PasswordHash, 
       JSON.stringify(['carrier']), 'approved', 200, 5000, 30, 2.5]
    );
    
    await db.run(
      `INSERT OR IGNORE INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['承运商租户2', '承运商二', '13900139002', 'carrier2@wuliu.com', carrier2PasswordHash, 
       JSON.stringify(['carrier']), 'approved', 150, 3000, 20, 3.0]
    );
    
    // 4. 创建6个订单
    console.log('📝 创建订单...');
    const customers = await db.all("SELECT id FROM tenants WHERE name LIKE '%客户%'");
    const carriers = await db.all("SELECT id FROM tenants WHERE name LIKE '%承运%'");
    
    if (customers.length >= 2 && carriers.length >= 2) {
      for (let i = 1; i <= 6; i++) {
        const customerId = customers[(i - 1) % customers.length].id; // 循环分配客户
        const carrierId = i <= 4 ? carriers[0].id : carriers[1].id; // 前4个给承运商1，后2个给承运商2
        
        await db.run(
          `INSERT OR IGNORE INTO orders (
            order_id, customer_tenant_id, carrier_tenant_id, pickup_address, delivery_address, 
            weight_kg, volume_m3, required_delivery_time, quote_deadline, status, 
            created_at, updated_at, sender_info, receiver_info, cargo_type, 
            length, width, height, description, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `ORD-TEST-${i.toString().padStart(3, '0')}`, // 订单ID
            customerId, // 客户租户ID
            i <= 2 ? null : carrierId, // 前2个订单未分配承运商，其余分配
            `发货地址${i}`, // 发货地址
            `收货地址${i}`, // 收货地址
            100 + i * 10, // 重量
            1.5 + i * 0.1, // 体积
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 要求交付时间（一周后）
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 报价截止时间（三天后）
            i <= 2 ? 'pending_claim' : i <= 4 ? 'claimed' : i <= 6 ? 'awarded' : 'pending_claim', // 订单状态
            JSON.stringify({name: `发货人${i}`, phone: `1380013800${i}`}), // 发货人信息
            JSON.stringify({name: `收货人${i}`, phone: `1390013900${i}`}), // 收货人信息
            ['家具家电', '装修建材', '办公用品', '快递包裹'][i % 4], // 货物类型
            1.2, // 长度
            0.8, // 宽度
            0.6, // 高度
            `订单${i}的备注`, // 描述
            200 + i * 50 // 总价
          ]
        );
        
        // 为已分配的订单创建报价
        if (i > 2) {
          await db.run(
            `INSERT OR IGNORE INTO quotes (
              order_id, carrier_tenant_id, price, estimated_hours, 
              note, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              `ORD-TEST-${i.toString().padStart(3, '0')}`, // 订单ID
              carrierId, // 承运商租户ID
              150 + i * 10, // 报价
              24 + i, // 预计小时
              `承运商${i > 4 ? 2 : 1}的报价`, // 备注
              'awarded' // 状态
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
          ['customer', tenant.id, 5000.00, 0.00, 'active', 'CNY', new Date().toISOString(), new Date().toISOString()]
        );
      } 
      // 为承运商创建钱包
      else if (tenant.name.includes('承运')) {
        await db.run(
          `INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          ['carrier', tenant.id, 3000.00, 0.00, 'active', 'CNY', new Date().toISOString(), new Date().toISOString()]
        );
      }
    }
    
    // 创建平台钱包
    await db.run(
      `INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['platform', 1, 10000.00, 0.00, 'active', 'CNY', new Date().toISOString(), new Date().toISOString()]
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
      wallets: await db.get("SELECT COUNT(*) as count FROM wallets").then(r => r.count)
    };
    
    console.log('\n📊 数据库统计:');
    console.log(`   - 用户: ${stats.users}`);
    console.log(`   - 租户: ${stats.tenants}`);
    console.log(`   - 订单: ${stats.orders}`);
    console.log(`   - 钱包: ${stats.wallets}`);
    
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