// backend/db/models/UserSession.js
const { getDb } = require('../connection'); // Use getDb function

class UserSessionModel {
  getDb() {
    return getDb(); // Get the current DB instance
  }

  async create(sessionId, userId, expiresAt) {
    const db = this.getDb(); // Get current connection
    const sql = `
      INSERT INTO user_sessions (session_id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;

    return new Promise((resolve, reject) => {
      db.run(sql, [sessionId, userId, expiresAt], function (err) {
        if (err) {
          console.error('Error creating user session record:', err);
          return reject(err);
        }
        // Resolve with the new ID and data
        resolve({
          id: this.lastID,
          session_id: sessionId,
          user_id: userId,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });
      });
    });
  }

  async findBySessionId(sessionId) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM user_sessions WHERE session_id = ?`;

    return new Promise((resolve, reject) => {
      db.get(sql, [sessionId], (err, row) => {
        if (err) {
          console.error('Error finding user session by session ID:', err);
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  async findByUserId(userId) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC`;

    return new Promise((resolve, reject) => {
      db.all(sql, [userId], (err, rows) => {
        if (err) {
          console.error('Error finding user sessions by user ID:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async updateExpiry(sessionId, newExpiresAt) {
    const db = this.getDb(); // Get current connection
    const sql = `UPDATE user_sessions SET expires_at = ? WHERE session_id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [newExpiresAt, sessionId], function (err) {
        if (err) {
          console.error('Error updating user session expiry:', err);
          return reject(err);
        }
        resolve(this.changes > 0); // Return true if a row was updated
      });
    });
  }

  async deleteExpired() {
    const db = this.getDb(); // Get current connection
    const sql = `DELETE FROM user_sessions WHERE expires_at < datetime('now')`;

    return new Promise((resolve, reject) => {
      db.run(sql, [], function (err) {
        if (err) {
          console.error('Error deleting expired user sessions:', err);
          return reject(err);
        }
        console.log(`Cleaned up  $ {this.changes} expired user sessions.`);
        resolve(this.changes); // Return number of deleted rows
      });
    });
  }

  async deleteBySessionId(sessionId) {
    const db = this.getDb(); // Get current connection
    const sql = `DELETE FROM user_sessions WHERE session_id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [sessionId], function (err) {
        if (err) {
          console.error('Error deleting user session by session ID:', err);
          return reject(err);
        }
        resolve(this.changes > 0); // Return true if a row was deleted
      });
    });
  }

  async deleteByUserId(userId) {
    const db = this.getDb(); // Get current connection
    const sql = `DELETE FROM user_sessions WHERE user_id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [userId], function (err) {
        if (err) {
          console.error('Error deleting user sessions by user ID:', err);
          return reject(err);
        }
        resolve(this.changes > 0); // Return true if any rows were deleted
      });
    });
  }

  async findAll(limit = 100, offset = 0) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          console.error('Error fetching all user sessions:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
}

module.exports = UserSessionModel; // Export the class