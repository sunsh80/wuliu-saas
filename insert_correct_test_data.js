// 插入测试数据到customer_applications表（根据实际表结构）
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
      id: 'test_pending_2',
      name: '测试公司2',
      phone: '13800138002',
      address: '北京市海淀区测试街2号',
      status: 'pending',
      created_at: '2026-02-05 10:05:00'
    },
    {
      id: 'test_approved_1',
      name: '已通过公司1',
      phone: '13800138003',
      address: '上海市浦东新区测试街3号',
      status: 'approved',
      created_at: '2026-02-05 11:00:00'
    },
    {
      id: 'test_approved_2',
      name: '已通过公司2',
      phone: '13800138004',
      address: '上海市徐汇区测试街4号',
      status: 'approved',
      created_at: '2026-02-05 11:05:00'
    },
    {
      id: 'test_rejected_1',
      name: '已驳回公司1',
      phone: '13800138005',
      address: '广州市天河区测试街5号',
      status: 'rejected',
      created_at: '2026-02-05 12:00:00'
    },
    {
      id: 'test_rejected_2',
      name: '已驳回公司2',
      phone: '13800138006',
      address: '广州市越秀区测试街6号',
      status: 'rejected',
      created_at: '2026-02-05 12:05:00'
    }
  ];

  testData.forEach((data, index) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO customer_applications 
      (id, name, phone, address, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run([
      data.id, 
      data.name, 
      data.phone, 
      data.address, 
      data.status, 
      data.created_at
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

  // 统计各状态的数据量
  console.log('\n📊 各状态数据统计:');
  db.each("SELECT status, COUNT(*) as count FROM customer_applications GROUP BY status", (err, row) => {
    if (err) {
      console.error('统计错误:', err.message);
    } else {
      console.log(`  ${row.status}: ${row.count} 个`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    console.log('\n✅ 数据库连接已关闭');
  });
});