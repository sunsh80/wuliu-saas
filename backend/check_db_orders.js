const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/mydatabase.db');

db.serialize(() => {
  // 检查数据库中orders表的实际结构
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders';", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      if (rows.length > 0) {
        console.log('Orders表在数据库中的实际定义:');
        console.log(rows[0].sql);
      } else {
        console.log('未找到名为 orders 的表');
      }
    }
  });
});

db.close(() => {
  console.log('Database connection closed.');
});