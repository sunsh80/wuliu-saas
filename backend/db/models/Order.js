// backend/db/models/Order.js
const { getDb } = require('../connection');

class OrderModel {
  async create(orderData) {
    const db = getDb();
    const {
      order_no,
      customer_id,
      tenant_id,
      status = 'pending',
      total_amount,
      items,
      delivery_address,
      contact_name,
      contact_phone
    } = orderData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO orders (
          order_no, customer_id, tenant_id, status, total_amount,
          items, delivery_address, contact_name, contact_phone,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          order_no, customer_id, tenant_id, status, total_amount,
          JSON.stringify(items), delivery_address, contact_name, contact_phone
        ],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...orderData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (row && row.items) {
          try {
            row.items = JSON.parse(row.items);
          } catch (e) {
            console.warn('解析订单 items 失败:', e.message);
          }
        }
        resolve(row);
      });
    });
  }

  async findByOrderNo(orderNo) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE order_no = ?', [orderNo], (err, row) => {
        if (err) return reject(err);
        if (row && row.items) {
          try {
            row.items = JSON.parse(row.items);
          } catch (e) {
            console.warn('解析订单 items 失败:', e.message);
          }
        }
        resolve(row);
      });
    });
  }

  async listByTenant(tenantId, limit = 20, offset = 0) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [tenantId, limit, offset],
        (err, rows) => {
          if (err) return reject(err);
          rows.forEach(row => {
            if (row.items) {
              try {
                row.items = JSON.parse(row.items);
              } catch (e) {
                console.warn('解析订单 items 失败:', e.message);
              }
            }
          });
          resolve(rows);
        }
      );
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = [
      'status', 'total_amount', 'items', 'delivery_address',
      'contact_name', 'contact_phone', 'delivery_time'
    ];
    const updateFields = [];
    const updateValues = [];

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(field === 'items' ? JSON.stringify(value) : value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);

    const sql = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = OrderModel;