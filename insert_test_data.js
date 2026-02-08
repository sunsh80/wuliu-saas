// 插入测试数据到customer_applications表
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 插入测试数据到customer_applications表...\n');

db.serialize(() => {
  // 插入一些测试数据
  const testData = [
    {
      id: 'test_pending_1',
      name: '测试公司1',
      phone: '13800138001',
      address: '北京市朝阳区测试街1号',
      status: 'pending',
      created_at: '2026-02-05 10:00:00'
    },
    {
      id: 'test_approved_1',
      name: '已通过公司1',
      phone: '13800138002',
      address: '上海市浦东新区测试街2号',
      status: 'approved',
      created_at: '2026-02-05 11:00:00',
      approved_at: '2026-02-05 12:00:00'
    },
    {
      id: 'test_rejected_1',
      name: '已驳回公司1',
      phone: '13800138003',
      address: '广州市天河区测试街3号',
      status: 'rejected',
      rejection_notes: '资质不符合要求',
      created_at: '2026-02-05 13:00:00',
      rejected_at: '2026-02-05 14:00:00'
    }
  ];

  testData.forEach((data, index) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO customer_applications 
      (id, name, phone, address, status, rejection_notes, created_at, updated_at, approved_at, rejected_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `);
    
    stmt.run([
      data.id, 
      data.name, 
      data.phone, 
      data.address, 
      data.status, 
      data.rejection_notes || null, 
      data.created_at,
      data.approved_at || null,
      data.rejected_at || null
    ]);
    stmt.finalize();
    
    console.log(`  已插入测试数据 ${index + 1}: ${data.name} (状态: ${data.status})`);
  });

  // 验证数据插入
  console.log('\n✅ 验证数据插入结果:');
  db.each("SELECT id, name, phone, status, created_at FROM customer_applications ORDER BY created_at DESC", (err, row) => {
    if (err) {
      console.error('查询错误:', err.message);
    } else {
      console.log(`  - ${row.name} (ID: ${row.id}, 状态: ${row.status}, 创建时间: ${row.created_at})`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});