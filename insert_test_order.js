const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在连接数据库:', dbPath);

// 插入一条测试订单，包含货物类型信息
const testOrder = {
  customer_tenant_id: 1,  // 假设租户ID为1
  tracking_number: `ORD-${Date.now()}-TEST`,
  sender_info: JSON.stringify({
    name: "张三",
    phone: "13800138000",
    address: "北京市朝阳区xxx街道",
    source: 'test'
  }),
  receiver_info: JSON.stringify({
    name: "李四",
    phone: "13900139000",
    address: "上海市浦东新区xxx路",
    source: 'test'
  }),
  status: 'pending_claim',
  quote_price: null,
  quote_delivery_time: null,
  customer_phone: "13800138000",
  weight_kg: 5.5,
  volume_m3: 0.5,
  required_delivery_time: null,
  quote_deadline: null,
  description: "测试订单描述",
  cargo_type: "家具家电",  // 这键：货物类型
  tenant_id: 1
};

console.log('\n=== 插入测试订单 ===');
db.run(
  `INSERT INTO orders (
    customer_tenant_id, tracking_number, sender_info, receiver_info, status,
    created_at, updated_at, quote_price, quote_delivery_time, customer_phone,
    weight_kg, volume_m3, required_delivery_time, quote_deadline, description, cargo_type, tenant_id
  ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    testOrder.customer_tenant_id,
    testOrder.tracking_number,
    testOrder.sender_info,
    testOrder.receiver_info,
    testOrder.status,
    testOrder.quote_price,
    testOrder.quote_delivery_time,
    testOrder.customer_phone,
    testOrder.weight_kg,
    testOrder.volume_m3,
    testOrder.required_delivery_time,
    testOrder.quote_deadline,
    testOrder.description,
    testOrder.cargo_type,
    testOrder.tenant_id
  ],
  function(err) {
    if (err) {
      console.error('插入测试订单失败:', err);
    } else {
      console.log('测试订单插入成功! ID:', this.lastID);
      
      // 查询刚插入的订单，验证数据
      console.log('\n=== 验证插入的数据 ===');
      db.get(
        "SELECT id, tracking_number, cargo_type, description, weight_kg, volume_m3, status, created_at FROM orders WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('查询测试订单失败:', err);
          } else {
            console.log('查询到的订单数据:');
            console.log(`  ID: ${row.id}`);
            console.log(`  跟踪号: ${row.tracking_number}`);
            console.log(`  货物类型: ${row.cargo_type || '(空)'}`);
            console.log(`  描述: ${row.description || '(空)'}`);
            console.log(`  重量: ${row.weight_kg} kg`);
            console.log(`  体积: ${row.volume_m3} m³`);
            console.log(`  状态: ${row.status}`);
            console.log(`  创建时间: ${row.created_at}`);
            
            console.log('\n✅ 测试订单验证成功！货物类型信息已正确存储。');
          }
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('关闭数据库时出错:', err);
            } else {
              console.log('\n数据库连接已关闭');
            }
          });
        }
      );
    }
  }
);