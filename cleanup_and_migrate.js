const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('Cleaning up any existing temporary tables...');

// 使用Promise包装数据库操作
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error(`Error executing query: ${query}`, err);
        reject(err);
      } else {
        console.log(`Query executed successfully: ${query}`);
        resolve(this);
      }
    });
  });
}

function getAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error executing query: ${query}`, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function cleanupAndMigrate() {
  try {
    // 首先尝试删除可能存在的临时表
    try {
      await runQuery('DROP TABLE IF EXISTS quotes_temp');
      console.log('Cleaned up any existing quotes_temp table');
    } catch (err) {
      console.log('No existing quotes_temp table to clean up');
    }

    console.log('Starting migration: Removing UNIQUE constraint from quotes table to enable multi-carrier bidding...');

    console.log('Step 1: Creating new quotes_temp table without UNIQUE constraint...');
    await runQuery(`
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
    `);

    console.log('Step 2: Copying data from old quotes table to new quotes_temp table...');
    await runQuery('INSERT INTO quotes_temp SELECT id, order_id, carrier_id, quote_price, quote_delivery_time, quote_remarks, created_at, updated_at FROM quotes');

    console.log('Step 3: Getting table info to verify data transfer...');
    const countBefore = await getAll('SELECT COUNT(*) as count FROM quotes');
    const countAfter = await getAll('SELECT COUNT(*) as count FROM quotes_temp');
    console.log(`Records in old table: ${countBefore[0].count}, Records in new table: ${countAfter[0].count}`);

    console.log('Step 4: Dropping old quotes table...');
    await runQuery('DROP TABLE quotes');

    console.log('Step 5: Renaming quotes_temp to quotes...');
    await runQuery('ALTER TABLE quotes_temp RENAME TO quotes');

    console.log('Step 6: Verifying the new table structure...');
    const tableInfo = await getAll("SELECT sql FROM sqlite_master WHERE type='table' AND name='quotes'");
    console.log('New quotes table structure:');
    console.log(tableInfo[0].sql);

    console.log('Migration completed successfully!');
    console.log('The quotes table now supports multiple quotes from different carriers for the same order.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close(() => {
      console.log('Database connection closed.');
    });
  }
}

cleanupAndMigrate();