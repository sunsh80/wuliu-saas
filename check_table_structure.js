// 检查customer_applications表结构
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查customer_applications表结构...\n');

db.serialize(() => {
  db.each("PRAGMA table_info(customer_applications)", (err, row) => {
    if (err) {
      console.error('错误:', err.message);
    } else {
      console.log(`  ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('关闭错误:', err.message);
    }
  });
});