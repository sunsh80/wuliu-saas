const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking quotes table structure ===');

db.serialize(() => {
  // 获取表定义
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='quotes'", (err, tableDefRows) => {
    if (err) {
      console.error('Error getting table definition:', err);
    } else if (tableDefRows.length > 0) {
      console.log('Quotes table definition:');
      console.log(tableDefRows[0].sql);
    } else {
      console.log('Quotes table does not exist');
    }
  });

  // 获取索引
  console.log('\n=== Checking indexes on quotes table ===');
  db.all("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='quotes'", (err, indexRows) => {
    if (err) {
      console.error('Error getting indexes:', err);
    } else if (indexRows.length > 0) {
      indexRows.forEach(row => {
        console.log(`Index ${row.name}: ${row.sql}`);
      });
    } else {
      console.log('No indexes found on quotes table');
    }
  });

  // 获取约束（通过表信息）
  console.log('\n=== Checking quotes table columns ===');
  db.all("PRAGMA table_info(quotes)", (err, columnRows) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      columnRows.forEach(row => {
        console.log(`${row.name} | ${row.type} | Not Null: ${row.notnull} | Default: ${row.dflt_value} | PK: ${row.pk}`);
      });
    }
  });

  // 获取外键
  console.log('\n=== Checking foreign keys on quotes table ===');
  db.all("PRAGMA foreign_key_list(quotes)", (err, fkRows) => {
    if (err) {
      console.error('Error getting foreign keys:', err);
    } else if (fkRows.length > 0) {
      fkRows.forEach(row => {
        console.log(`FK from ${row.from} to ${row.table}.${row.to}`);
      });
    } else {
      console.log('No foreign keys found on quotes table');
    }
  });
});

db.close(() => {
  console.log('\nDatabase connection closed.');
});