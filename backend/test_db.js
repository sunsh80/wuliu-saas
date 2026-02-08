const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/mydatabase.db');

console.log('Attempting to connect to database...');

db.serialize(() => {
  console.log('Connected to database, checking tables...');
  
  // 检查所有表
  db.each("SELECT name FROM sqlite_master WHERE type='table'", [], (err, row) => {
    if (err) {
      console.error('Error getting table names:', err);
    } else {
      console.log('Found table:', row.name);
    }
  });

  // 检查用户表结构
  console.log('\nChecking users table structure...');
  db.each("PRAGMA table_info(users)", [], (err, row) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      console.log('Column:', row.name, 'Type:', row.type, 'NotNull:', row.notnull, 'Default:', row.dflt_value);
    }
  });

  // 检查用户数量
  console.log('\nChecking user count...');
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error('Error counting users:', err);
    } else {
      console.log('Total users in database:', row.count);
      
      if (row.count > 0) {
        console.log('\nListing all users...');
        db.each('SELECT id, username, email, role, type FROM users', [], (err, userRow) => {
          if (err) {
            console.error('Error getting users:', err);
          } else {
            console.log('User:', {
              id: userRow.id,
              username: userRow.username,
              email: userRow.email,
              role: userRow.role,
              type: userRow.type
            });
          }
        });
      }
    }
  });
});

db.close(() => {
  console.log('Database connection closed.');
});