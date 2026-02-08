// 检查quotes表结构和数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查quotes表结构和数据...\n');

db.serialize(() => {
  // 检查quotes表结构
  console.log('📋 quotes表结构:');
  db.each("PRAGMA table_info(quotes)", (err, row) => {
    if (err) {
      console.error('错误:', err.message);
    } else {
      console.log(`  ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    }
  });

  // 检查quotes表数据
  console.log('\n📊 quotes表中的数据:');
  db.each("SELECT * FROM quotes ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('quotes表可能为空或不存在:', err.message);
    } else {
      console.log('  数据:', JSON.stringify(row));
    }
  });

  // 检查订单表中的报价相关字段
  console.log('\n📋 orders表中的报价相关字段:');
  db.each("SELECT id, tracking_number, quote_price, quote_delivery_time, quote_remarks, quote_deadline, status FROM orders WHERE quote_price IS NOT NULL OR quote_delivery_time IS NOT NULL ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.log('查询订单表报价字段时出错:', err.message);
    } else {
      console.log('  订单报价数据:', JSON.stringify(row));
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});