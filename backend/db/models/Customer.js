// backend/db/models/Customer.js
const { getDb } = require('../connection');

class CustomerModel {
  async create(customerData) {
    const db = getDb();
    const {
      name,
      phone,
      email,
      tenant_id,
      address = '',
      remark = ''
    } = customerData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO customers (
          name, phone, email, tenant_id, address, remark, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [name, phone, email, tenant_id, address, remark],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...customerData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByPhone(phone, tenantId) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE phone = ? AND tenant_id = ?',
        [phone, tenantId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  async listByTenant(tenantId, limit = 50, offset = 0) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM customers WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [tenantId, limit, offset],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = ['name', 'phone', 'email', 'address', 'remark'];
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

    const sql = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;

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
      db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = CustomerModel;