const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/mydatabase.db');

console.log('Attempting to connect to database...');

db.serialize(() => {
  console.log('Connected to database, checking tables...');

  // 检查所有表
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tableRows) => {
    if (err) {
      console.error('Error getting table names:', err);
    } else {
      tableRows.forEach(row => {
        console.log('Found table:', row.name);
      });

      // 检查用户表结构
      console.log('\nChecking users table structure...');
      db.all("PRAGMA table_info(users)", (err, userInfoRows) => {
        if (err) {
          console.error('Error getting table info:', err);
        } else {
          userInfoRows.forEach(row => {
            console.log('Column:', row.name, 'Type:', row.type, 'NotNull:', row.notnull, 'Default:', row.dflt_value);
          });

          // 检查用户数量
          console.log('\nChecking user count...');
          db.get('SELECT COUNT(*) as count FROM users', (err, userCount) => {
            if (err) {
              console.error('Error counting users:', err);
            } else {
              console.log('Total users in database:', userCount.count);

              if (userCount.count > 0) {
                console.log('\nListing all users...');
                db.all('SELECT id, username, email, role, type FROM users', (err, users) => {
                  if (err) {
                    console.error('Error getting users:', err);
                  } else {
                    users.forEach(userRow => {
                      console.log('User:', {
                        id: userRow.id,
                        username: userRow.username,
                        email: userRow.email,
                        role: userRow.role,
                        type: userRow.type
                      });
                    });
                  }
                });
              }
            }
          });
        }
      });
    }
  });
});

db.close(() => {
  console.log('Database connection closed.');
});