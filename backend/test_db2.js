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

  // 检查用户数量
  console.log('\nChecking user count...');
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error('Error counting users:', err);
    } else {
      console.log('Total users in database:', row.count);
      
      if (row.count > 0) {
        console.log('\nListing all users...');
        // 使用 all 而不是 each，这样可以确保在回调完成后关闭数据库
        db.all('SELECT id, username, email, role, roles, type FROM users', [], (err, userRows) => {
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
          
          // 现在关闭数据库
          db.close(() => {
            console.log('Database connection closed.');
          });
        });
      } else {
        db.close(() => {
          console.log('Database connection closed.');
        });
      }
    }
  });
});