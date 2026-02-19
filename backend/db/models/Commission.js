// backend/db/models/Commission.js
const { getDb } = require('../connection');

class CommissionModel {
  // 抽佣配置
  async createConfig(configData) {
    const db = getDb();
    const {
      platform_rate,
      carrier_rate,
      min_amount,
      max_amount,
      effective_date,
      notes
    } = configData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO commission_configs (
          platform_rate, carrier_rate, min_amount, max_amount,
          effective_date, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [platform_rate, carrier_rate, min_amount, max_amount, effective_date, notes],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...configData });
        }
      );
    });
  }

  async getConfigById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM commission_configs WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async getCurrentConfig() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM commission_configs ORDER BY effective_date DESC LIMIT 1',
        [],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  async listConfigs() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM commission_configs ORDER BY effective_date DESC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async updateConfig(id, updates) {
    const db = getDb();
    const allowedFields = ['platform_rate', 'carrier_rate', 'min_amount', 'max_amount', 'notes'];
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

    const sql = `UPDATE commission_configs SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  // 分级抽佣配置
  async createTier(tierData) {
    const db = getDb();
    const {
      min_amount,
      max_amount,
      platform_rate,
      carrier_rate,
      config_id
    } = tierData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO commission_tiers (
          config_id, min_amount, max_amount, platform_rate, carrier_rate,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [config_id, min_amount, max_amount, platform_rate, carrier_rate],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...tierData });
        }
      );
    });
  }

  async listTiers(configId) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM commission_tiers WHERE config_id = ? ORDER BY min_amount ASC',
        [configId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async updateTier(id, updates) {
    const db = getDb();
    const allowedFields = ['min_amount', 'max_amount', 'platform_rate', 'carrier_rate'];
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

    const sql = `UPDATE commission_tiers SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  // 抽佣记录
  async createRecord(recordData) {
    const db = getDb();
    const {
      order_id,
      order_amount,
      platform_commission,
      carrier_commission,
      status = 'pending',
      paid_date
    } = recordData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO commission_records (
          order_id, order_amount, platform_commission, carrier_commission,
          status, paid_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [order_id, order_amount, platform_commission, carrier_commission, status, paid_date],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...recordData });
        }
      );
    });
  }

  async listRecords(filters = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM commission_records WHERE 1=1';
    const params = [];

    if (filters.order_id) {
      sql += ' AND order_id = ?';
      params.push(filters.order_id);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async updateRecordStatus(id, status, paidDate) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE commission_records 
         SET status = ?, paid_date = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, paidDate, id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  async getStats() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_records,
          SUM(platform_commission) as total_platform,
          SUM(carrier_commission) as total_carrier,
          SUM(CASE WHEN status = 'completed' THEN platform_commission ELSE 0 END) as completed_platform
        FROM commission_records
      `, [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = CommissionModel;
