// backend/db/models/Violation.js
const { getDb } = require('../connection');

class ViolationModel {
  async create(violationData) {
    const db = getDb();
    const {
      tenant_id,
      tenant_name,
      violation_type,
      description,
      violation_date,
      severity,
      status = 'pending',
      handler_id,
      handle_notes,
      handle_date
    } = violationData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO violations (
          tenant_id, tenant_name, violation_type, description,
          violation_date, severity, status, handler_id, handle_notes, handle_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [tenant_id, tenant_name, violation_type, description,
         violation_date, severity, status, handler_id, handle_notes, handle_date],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...violationData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM violations WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async listAll(filters = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM violations WHERE 1=1';
    const params = [];

    if (filters.tenant_id) {
      sql += ' AND tenant_id = ?';
      params.push(filters.tenant_id);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.severity) {
      sql += ' AND severity = ?';
      params.push(filters.severity);
    }
    if (filters.violation_type) {
      sql += ' AND violation_type = ?';
      params.push(filters.violation_type);
    }

    sql += ' ORDER BY violation_date DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = [
      'status', 'handler_id', 'handle_notes', 'handle_date',
      'severity', 'description'
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

    const sql = `UPDATE violations SET ${updateFields.join(', ')} WHERE id = ?`;

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
      db.run('DELETE FROM violations WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async getStats() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed_count,
          SUM(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 ELSE 0 END) as high_severity_count
        FROM violations
      `, [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = ViolationModel;
