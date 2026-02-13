// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接（使用项目中的标准数据库文件）
const dbPath = path.join(__dirname, 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 连接到 SQLite 数据库:', dbPath);
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) {
        console.warn('⚠️ 启用外键约束失败:', err.message);
      } else {
        console.log('✅ 外键约束已启用');
      }
    });
  }
});

// 提供异步包装器
const runAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const getAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  run: runAsync,
  get: getAsync,
  all: allAsync,
};