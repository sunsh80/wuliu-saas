const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('=== Checking quotes table structure ===');
  
  // 获取表定义
  db.each("SELECT sql FROM sqlite_master WHERE type='table' AND name='quotes'", (err, row) => {
    if (err) {
      console.error('Error getting table definition:', err);
    } else if (row) {
      console.log('Quotes table definition:');
      console.log(row.sql);
    } else {
      console.log('Quotes table does not exist');
    }
  });
  
  // 获取索引
  console.log('\n=== Checking indexes on quotes table ===');
  db.each("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='quotes'", (err, row) => {
    if (err) {
      console.error('Error getting indexes:', err);
    } else if (row) {
      console.log(`Index ${row.name}: ${row.sql}`);
    } else {
      console.log('No indexes found on quotes table');
    }
  });
  
  // 获取约束（通过表信息）
  console.log('\n=== Checking quotes table columns ===');
  db.each("PRAGMA table_info(quotes)", (err, row) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      console.log(`${row.name} | ${row.type} | Not Null: ${row.notnull} | Default: ${row.dflt_value} | PK: ${row.pk}`);
    }
  });
  
  // 获取外键
  console.log('\n=== Checking foreign keys on quotes table ===');
  db.each("PRAGMA foreign_key_list(quotes)", (err, row) => {
    if (err) {
      console.error('Error getting foreign keys:', err);
    } else if (row) {
      console.log(`FK from ${row.from} to ${row.table}.${row.to}`);
    }
  });
});

db.close(() => {
  console.log('\nDatabase connection closed.');
});