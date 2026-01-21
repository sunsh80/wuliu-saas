// backend/db/models/Tenant.js
const { getDb } = require('../connection');

class TenantModel {
  async create(tenantData) {
    const db = getDb();
    const { name, code, status = 'active', contact_name, contact_phone, contact_email } = tenantData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tenants (
          name, code, status, contact_name, contact_phone, contact_email, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [name, code, status, contact_name, contact_phone, contact_email],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...tenantData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tenants WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByCode(code) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tenants WHERE code = ?', [code], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async listAll() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM tenants ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = ['name', 'status', 'contact_name', 'contact_phone', 'contact_email'];
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

    const sql = `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async delete(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tenants WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = TenantModel;