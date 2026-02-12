// check_schema.js - 检查数据库表结构
const { openDatabaseAndInitialize, getDb } = require('./db/index.js');

async function checkSchema() {
  console.log('🔍 检查数据库表结构...');
  
  // 初始化数据库
  await openDatabaseAndInitialize();
  const db = getDb();
  
  try {
    // 检查订单表结构
    console.log('\n📋 Orders 表结构:');
    const ordersSchema = await db.all("PRAGMA table_info(orders)");
    console.log(ordersSchema);
    
    // 检查租户表结构
    console.log('\n📋 Tenants 表结构:');
    const tenantsSchema = await db.all("PRAGMA table_info(tenants)");
    console.log(tenantsSchema);
    
    // 检查用户表结构
    console.log('\n📋 Users 表结构:');
    const usersSchema = await db.all("PRAGMA table_info(users)");
    console.log(usersSchema);
    
    // 检查钱包表结构
    console.log('\n📋 Wallets 表结构:');
    const walletsSchema = await db.all("PRAGMA table_info(wallets)");
    console.log(walletsSchema);
    
    // 检查报价表结构
    console.log('\n📋 Quotes 表结构:');
    const quotesSchema = await db.all("PRAGMA table_info(quotes)");
    console.log(quotesSchema);
    
    // 显示现有数据统计
    console.log('\n📊 现有数据统计:');
    const tables = ['users', 'tenants', 'orders', 'wallets', 'quotes'];
    for (const table of tables) {
      try {
        const count = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   - ${table}: ${count.count} 条记录`);
      } catch (e) {
        console.log(`   - ${table}: 无法统计 (${e.message})`);
      }
    }
  } catch (error) {
    console.error('❌ 检查数据库结构时出错:', error);
    throw error;
  }
}

if (require.main === module) {
  checkSchema()
    .then(() => {
      console.log('\n✅ 数据库结构检查完成！');
    })
    .catch((error) => {
      console.error('\n❌ 数据库结构检查失败:', error);
      process.exit(1);
    });
}