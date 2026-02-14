const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting migration: Removing UNIQUE constraint from quotes table to enable multi-carrier bidding...');

db.serialize(() => {
  // 1. 创建新表，不包含UNIQUE约束
  console.log('Step 1: Creating new quotes_temp table without UNIQUE constraint...');
  db.run(`
    CREATE TABLE quotes_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      carrier_id INTEGER NOT NULL,
      quote_price REAL NOT NULL,
      quote_delivery_time TEXT NOT NULL,
      quote_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating temporary table:', err);
      return db.close();
    }

    console.log('Step 2: Copying data from old quotes table to new quotes_temp table...');
    // 2. 将数据从旧表复制到新表
    db.run('INSERT INTO quotes_temp SELECT * FROM quotes', (err) => {
      if (err) {
        console.error('Error copying data:', err);
        return db.close();
      }

      console.log('Step 3: Dropping old quotes table...');
      // 3. 删除旧表
      db.run('DROP TABLE quotes', (err) => {
        if (err) {
          console.error('Error dropping old table:', err);
          return db.close();
        }

        console.log('Step 4: Renaming quotes_temp to quotes...');
        // 4. 将新表重命名为原表名
        db.run('ALTER TABLE quotes_temp RENAME TO quotes', (err) => {
          if (err) {
            console.error('Error renaming table:', err);
            return db.close();
          }

          console.log('Step 5: Verifying the new table structure...');
          // 5. 验证新表结构
          db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='quotes'", (err, rows) => {
            if (err) {
              console.error('Error verifying table structure:', err);
            } else {
              if (rows.length > 0) {
                console.log('New quotes table structure:');
                console.log(rows[0].sql);

                console.log('Migration completed successfully!');
                console.log('The quotes table now supports multiple quotes from different carriers for the same order.');
              } else {
                console.log('Could not verify the new table structure');
              }
            }
          });
        });
      });
    });
  });
});

db.close(() => {
  console.log('Database connection closed.');
});