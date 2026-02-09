// backend/db/migrations/add_addons_to_orders.js
const { getDb } = require('../index.js');

async function addAddonsToOrders() {
  const db = getDb();
  
  console.log('🔄 开始更新订单表结构，添加附加费相关字段...');
  
  try {
    // 添加附加费相关字段到订单表
    await db.exec(`
      ALTER TABLE orders ADD COLUMN addons_config TEXT; -- 附加服务配置(JSON格式)
    `);
    console.log('✅ 添加 addons_config 字段到 orders 表');
    
    await db.exec(`
      ALTER TABLE orders ADD COLUMN addons_total REAL DEFAULT 0.0; -- 附加费总额
    `);
    console.log('✅ 添加 addons_total 字段到 orders 表');
    
    await db.exec(`
      ALTER TABLE orders ADD COLUMN addons_status TEXT DEFAULT 'pending' CHECK (addons_status IN ('pending', 'confirmed', 'rejected')); -- 附加费状态
    `);
    console.log('✅ 添加 addons_status 字段到 orders 表');
    
    await db.exec(`
      ALTER TABLE orders ADD COLUMN addons_confirmation_time TEXT; -- 附加费确认时间
    `);
    console.log('✅ 添加 addons_confirmation_time 字段到 orders 表');
    
    console.log('🎉 订单表结构更新完成！');
    console.log('新增字段说明:');
    console.log('  - addons_config: 附加服务配置(JSON格式)');
    console.log('  - addons_total: 附加费总额');
    console.log('  - addons_status: 附加费状态(pending/confirmed/rejected)');
    console.log('  - addons_confirmation_time: 附加费确认时间');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ 字段已存在，跳过添加');
    } else {
      console.error('❌ 更新订单表结构失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此文件，则执行更新
if (require.main === module) {
  addAddonsToOrders()
    .then(() => {
      console.log('数据库迁移完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { addAddonsToOrders };