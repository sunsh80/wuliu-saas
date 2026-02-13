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

      // 检查用户数量
      console.log('\nChecking user count...');
      db.get('SELECT COUNT(*) as count FROM users', (err, userCount) => {
        if (err) {
          console.error('Error counting users:', err);
        } else {
          console.log('Total users in database:', userCount.count);

          if (userCount.count > 0) {
            console.log('\nListing all users...');
            db.all('SELECT id, username, email, role, roles, type FROM users', (err, userRows) => {
              if (err) {
                console.error('Error getting users:', err);
              } else {
                userRows.forEach(userRow => {
                  console.log('User:', {
                    id: userRow.id,
                    username: userRow.username,
                    email: userRow.email,
                    role: userRow.role,
                    roles: userRow.roles,  // 这个字段可能包含用户角色信息
                    type: userRow.type
                  });

                  // 检查是否是我们要找的用户
                  if (userRow.email && userRow.email.includes('6234567@163.com')) {
                    console.log('>>> FOUND TARGET USER <<<');
                  }
                });
              }
            });
          }
        }
      });
    }
  });
});

db.close(() => {
  console.log('Database connection closed.');
});