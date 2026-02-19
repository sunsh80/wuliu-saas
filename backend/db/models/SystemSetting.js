// backend/db/models/SystemSetting.js
const { getDb } = require('../connection');

class SystemSettingModel {
  async create(settingData) {
    const db = getDb();
    const {
      category,
      key,
      value,
      value_type = 'string',
      description,
      is_public = 1
    } = settingData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO system_settings (
          category, key, value, value_type, description, is_public,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [category, key, value, value_type, description, is_public],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...settingData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM system_settings WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByKey(key) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM system_settings WHERE key = ?', [key], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async listByCategory(category) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM system_settings WHERE category = ? ORDER BY key ASC',
        [category],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async listAll() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM system_settings ORDER BY category ASC, key ASC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async listPublic() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM system_settings WHERE is_public = 1 ORDER BY category ASC, key ASC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = ['value', 'description', 'is_public'];
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

    const sql = `UPDATE system_settings SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async updateByKey(key, value) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE system_settings 
         SET value = ?, updated_at = datetime('now')
         WHERE key = ?`,
        [value, key],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  async delete(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM system_settings WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async getSettingsGrouped() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT category, key, value, value_type, description, is_public
         FROM system_settings 
         ORDER BY category ASC, key ASC`,
        [],
        (err, rows) => {
          if (err) return reject(err);
          
          // 按 category 分组
          const grouped = {};
          rows.forEach(row => {
            if (!grouped[row.category]) {
              grouped[row.category] = {};
            }
            // 根据 value_type 转换值类型
            let value = row.value;
            if (row.value_type === 'number') {
              value = parseFloat(row.value);
            } else if (row.value_type === 'boolean') {
              value = row.value === 'true';
            }
            grouped[row.category][row.key] = {
              value,
              description: row.description,
              is_public: row.is_public
            };
          });
          
          resolve(grouped);
        }
      );
    });
  }
}

module.exports = SystemSettingModel;
