// test-db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.get("SELECT tenant_id FROM users WHERE id = 2", (err, row) => {
  if (err) {
    console.error("❌ DB Error:", err.message);
  } else {
    console.log("✅ DB Query Success:", row);
  }
  db.close();
});