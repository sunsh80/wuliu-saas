const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/mydatabase.db');

db.serialize(() => {
  // 检查数据库中orders表的实际结构
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders';", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Orders表在数据库中的实际定义:');
      console.log(rows[0].sql);
    }
  });
});

db.close();