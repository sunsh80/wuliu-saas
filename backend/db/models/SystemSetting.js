// backend/db/models/SystemSetting.js
const { getDb } = require('../connection');

class SystemSettingModel {
  async create(settingData) {
    const db = getDb();
    const {
      category = 'general',
      config_key,
      config_value,
      config_type = 'string',
      description = '',
      is_public = 0,
      is_enabled = 1
    } = settingData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO system_settings (
          category, config_key, config_value, config_type, description, is_public, is_enabled,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [category, config_key, config_value, config_type, description, is_public ? 1 : 0, is_enabled ? 1 : 0],
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

  async findByKey(config_key) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM system_settings WHERE config_key = ?', [config_key], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async listByCategory(category) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM system_settings WHERE category = ? ORDER BY config_key ASC',
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
        'SELECT * FROM system_settings ORDER BY category ASC, config_key ASC',
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
        'SELECT * FROM system_settings WHERE is_public = 1 ORDER BY category ASC, config_key ASC',
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
    const allowedFields = ['config_value', 'description', 'is_public', 'is_enabled'];
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

  async updateByKey(config_key, config_value) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE system_settings
         SET config_value = ?, updated_at = datetime('now')
         WHERE config_key = ?`,
        [config_value, config_key],
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
        `SELECT category, config_key, config_value, config_type, description, is_public, is_enabled
         FROM system_settings
         ORDER BY category ASC, config_key ASC`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          // 按 category 分组
          const grouped = {};
          rows.forEach(row => {
            if (!grouped[row.category]) {
              grouped[row.category] = {};
            }
            // 根据 config_type 转换值类型
            let value = row.config_value;
            if (row.config_type === 'number') {
              value = parseFloat(row.config_value);
            } else if (row.config_type === 'boolean') {
              value = row.config_value === 'true' || row.config_value === '1';
            } else if (row.config_type === 'json') {
              try {
                value = JSON.parse(row.config_value);
              } catch (e) {
                // 保持原值
              }
            }
            grouped[row.category][row.config_key] = {
              value,
              type: row.config_type,
              description: row.description,
              is_public: row.is_public,
              is_enabled: row.is_enabled
            };
          });

          resolve(grouped);
        }
      );
    });
  }

  async getConfig(config_key, defaultValue = null) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT config_value, config_type, is_enabled FROM system_settings WHERE config_key = ?',
        [config_key],
        (err, row) => {
          if (err) return reject(err);
          if (!row || !row.is_enabled) {
            resolve(defaultValue);
            return;
          }
          
          let value = row.config_value;
          switch (row.config_type) {
            case 'number':
              value = parseFloat(row.config_value);
              break;
            case 'boolean':
              value = row.config_value === 'true' || row.config_value === '1';
              break;
            case 'json':
              try {
                value = JSON.parse(row.config_value);
              } catch (e) {
                // 保持原值
              }
              break;
          }
          resolve(value);
        }
      );
    });
  }

  async setConfig(config_key, config_value, config_type = 'string', description = '', category = 'general') {
    const db = getDb();
    const existing = await this.findByKey(config_key);
    
    if (existing) {
      return this.updateByKey(config_key, JSON.stringify(config_value));
    } else {
      return this.create({
        category,
        config_key,
        config_value: JSON.stringify(config_value),
        config_type,
        description,
        is_public: 0,
        is_enabled: 1
      });
    }
  }
}

module.exports = SystemSettingModel;
