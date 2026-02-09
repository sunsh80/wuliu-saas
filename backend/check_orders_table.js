const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/mydatabase.db');

db.serialize(() => {
  db.all("PRAGMA table_info(orders);", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Orders表结构:');
      rows.forEach(row => {
        console.log(row.cid + ': ' + row.name + ' (' + row.type + ') - ' + (row.notnull ? 'NOT NULL' : 'NULL') + ' - Default: ' + row.dflt_value);
      });
    }
  });
});

db.close();