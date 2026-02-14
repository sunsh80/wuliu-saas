const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查数据库内容 ===');

db.serialize(() => {
  // 检查订单表
  console.log('\n--- 订单表 (最近3条) ---');
  db.all('SELECT id, tracking_number, status, customer_tenant_id, carrier_id FROM orders ORDER BY id DESC LIMIT 3', (err, orderRows) => {
    if (err) {
      console.error('查询订单表出错:', err.message);
    } else {
      console.table(orderRows);
    }
  });

  // 检查报价表
  console.log('\n--- 报价表 (最近10条) ---');
  db.all('SELECT id, order_id, carrier_id, quote_price, quote_delivery_time FROM quotes ORDER BY id DESC LIMIT 10', (err, quoteRows) => {
    if (err) {
      console.error('查询报价表出错:', err.message);
    } else {
      if (quoteRows.length > 0) {
        console.table(quoteRows);
      } else {
        console.log('报价表为空或没有数据');
      }
    }
  });

  // 检查租户表
  console.log('\n--- 租户表 (最近10条) ---');
  db.all('SELECT id, name, email, status FROM tenants ORDER BY id DESC LIMIT 10', (err, tenantRows) => {
    if (err) {
      console.error('查询租户表出错:', err.message);
    } else {
      console.table(tenantRows);
    }
  });
});

db.close(() => {
  console.log('\n数据库连接已关闭');
});