const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');

console.log('Opening database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not open database:', err);
    return;
  }
  
  console.log('Database opened successfully');
  
  // 检查表是否存在
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err);
    } else {
      console.log('Tables in database:', tables.map(t => t.name));
      
      // 查询订单表
      db.all('SELECT COUNT(*) as count FROM orders', (err, result) => {
        if (err) {
          console.error('Error counting orders:', err);
        } else {
          console.log('Total orders:', result[0].count);
          
          // 查询最新的订单
          db.all('SELECT * FROM orders ORDER BY id DESC LIMIT 3', (err, rows) => {
            if (err) {
              console.error('Error getting latest orders:', err);
            } else {
              console.log('Latest orders:', rows);
              
              // 查询报价表
              db.all('SELECT COUNT(*) as count FROM quotes', (err, result) => {
                if (err) {
                  console.error('Error counting quotes:', err);
                } else {
                  console.log('Total quotes:', result[0].count);
                  
                  // 查询最新的报价
                  db.all('SELECT * FROM quotes ORDER BY id DESC LIMIT 3', (err, rows) => {
                    if (err) {
                      console.error('Error getting latest quotes:', err);
                    } else {
                      console.log('Latest quotes:', rows);
                      
                      // 关闭数据库
                      db.close((err) => {
                        if (err) {
                          console.error('Error closing database:', err);
                        } else {
                          console.log('Database closed successfully');
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});