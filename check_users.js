const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在连接到数据库:', dbPath);

// 查询用户表
db.serialize(() => {
  console.log('\n=== 查询用户表 ===');
  db.each("SELECT * FROM users LIMIT 10", (err, row) => {
    if (err) {
      console.error('查询用户表时出错:', err.message);
    } else {
      console.log('用户数据:', row);
    }
  });

  console.log('\n=== 查询用户总数 ===');
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('查询用户总数时出错:', err.message);
    } else {
      console.log('总用户数:', row.count);
    }
  });

  console.log('\n=== 查询管理员用户 ===');
  db.each("SELECT * FROM users WHERE user_type = 'admin_user'", (err, row) => {
    if (err) {
      console.error('查询管理员用户时出错:', err.message);
    } else {
      console.log('管理员用户:', row);
    }
  });

  console.log('\n=== 查询租户用户 ===');
  db.each("SELECT * FROM users WHERE user_type = 'tenant_user'", (err, row) => {
    if (err) {
      console.error('查询租户用户时出错:', err.message);
    } else {
      console.log('租户用户:', row);
    }
  });

  console.log('\n=== 查询所有租户 ===');
  db.each("SELECT * FROM tenants LIMIT 10", (err, row) => {
    if (err) {
      console.error('查询租户表时出错:', err.message);
    } else {
      console.log('租户数据:', row);
    }
  });

  console.log('\n=== 查询租户总数 ===');
  db.get("SELECT COUNT(*) as count FROM tenants", (err, row) => {
    if (err) {
      console.error('查询租户总数时出错:', err.message);
    } else {
      console.log('总租户数:', row.count);
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库时出错:', err.message);
  } else {
    console.log('\n数据库连接已关闭');
  }
});