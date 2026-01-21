// backend/db/models/Organization.js
const { getDb } = require('../connection');

class OrganizationModel {
  async create(orgData) {
    const db = getDb();
    const { name, type = 'tenant', status = 'pending' } = orgData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO organizations (name, type, status, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [name, type, status],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...orgData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM organizations WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async listAll() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM organizations ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = ['name', 'type', 'status'];
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

    const sql = `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`;

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
      db.run('DELETE FROM organizations WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = OrganizationModel;