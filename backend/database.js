// database.js
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// 创建数据库连接（如果 wuliu.db 不存在会自动创建）
const db = new sqlite3.Database('./wuliu.db', (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 连接到 SQLite 数据库');
  }
});

// 将 db.run 包装为 Promise 函数
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

module.exports = {
  db,
  run,
  get,
  all,
};