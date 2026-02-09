// backend/db/models/OrderModel.js - 适配现有数据库结构的订单模型
const { getDb } = require('../connection');

class OrderModel {
  // 创建订单（适配现有数据库结构）
  async create(orderData) {
    const db = getDb();
    const {
      customer_tenant_id,
      carrier_id,
      tenant_id,
      tracking_number,
      sender_info,
      receiver_info,
      status = 'created',
      quote_price,
      quote_delivery_time,
      quote_remarks,
      quote_deadline,
      customer_phone,
      weight_kg,
      volume_m3,
      required_delivery_time,
      description,
      cargo_type
    } = orderData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO orders (
          customer_tenant_id, carrier_id, tenant_id, tracking_number, 
          sender_info, receiver_info, status, quote_price, quote_delivery_time,
          quote_remarks, quote_deadline, customer_phone, weight_kg, volume_m3,
          required_delivery_time, description, cargo_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          customer_tenant_id, carrier_id, tenant_id, tracking_number,
          sender_info, receiver_info, status, quote_price, quote_delivery_time,
          quote_remarks, quote_deadline, customer_phone, weight_kg, volume_m3,
          required_delivery_time, description, cargo_type
        ],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, tracking_number, status });
        }
      );
    });
  }

  // 根据ID查找订单
  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // 根据跟踪号查找订单
  async findByTrackingNumber(trackingNumber) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE tracking_number = ?', [trackingNumber], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // 根据租户ID列出订单
  async listByTenant(tenantId, limit = 20, offset = 0) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM orders WHERE customer_tenant_id = ? OR tenant_id = ? 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [tenantId, tenantId, limit, offset],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  // 更新订单
  async update(id, updates) {
    const db = getDb();
    const allowedFields = [
      'status', 'quote_price', 'quote_delivery_time', 'quote_remarks', 
      'quote_deadline', 'customer_phone', 'weight_kg', 'volume_m3',
      'required_delivery_time', 'description', 'cargo_type', 'carrier_id'
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