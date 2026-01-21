// backend/db/models/User.js
const bcrypt = require('bcryptjs');
const { getDb } = require('../connection');

class UserModel {
  constructor() {
    // 不再在这里初始化 this.db
  }

  getDb() {
    return getDb(); // 每次需要时获取最新连接
  }

  async create(userData) {
    const db = this.getDb();
    const { username, email, password, user_type, tenant_id, customer_id, name = '', role = 'user', type = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (
          username, email, password_hash, user_type, tenant_id, customer_id, 
          name, role, type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [username, email, hashedPassword, user_type, tenant_id, customer_id, name, role, type],
        function(err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            username,
            email,
            name,
            role,
            type,
            user_type,
            tenant_id,
            customer_id,
            is_active: 1,
            status: 'active',
            created_at: new Date().toISOString()
          });
        }
      );
    });
  }

  async findById(id) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByUsername(username) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByEmail(email) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async update(id, updates) {
    const db = this.getDb();
    const allowedFields = [
      'name', 'email', 'role', 'type', 'organization_id', 
      'organization_name', 'organization_type', 'status', 'is_active'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }
    
    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);
    
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async delete(id) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = UserModel;