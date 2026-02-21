// backend/db/models/ServiceProvider.js
const { getDb } = require('../connection');

class ServiceProviderModel {
  async create(providerData) {
    const db = getDb();
    const {
      provider_name,
      provider_type,
      api_endpoint = null,
      api_key = null,
      auth_token = null,
      is_enabled = 1,
      config_json = null,
      priority = 0
    } = providerData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO service_providers (
          provider_name, provider_type, api_endpoint, api_key, auth_token,
          is_enabled, config_json, priority,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          provider_name,
          provider_type,
          api_endpoint,
          api_key,
          auth_token,
          is_enabled ? 1 : 0,
          config_json ? JSON.stringify(config_json) : null,
          priority
        ],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...providerData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM service_providers WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async findByName(provider_name) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM service_providers WHERE provider_name = ?',
        [provider_name],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  async findByType(provider_type) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM service_providers WHERE provider_type = ? ORDER BY priority ASC, id ASC',
        [provider_type],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getEnabledByType(provider_type) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM service_providers WHERE provider_type = ? AND is_enabled = 1 ORDER BY priority ASC, id ASC',
        [provider_type],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getDefaultProvider(provider_type) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM service_providers WHERE provider_type = ? AND is_enabled = 1 ORDER BY priority ASC, id ASC LIMIT 1',
        [provider_type],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  async listAll() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM service_providers ORDER BY provider_type ASC, priority ASC',
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
    const allowedFields = [
      'api_endpoint',
      'api_key',
      'auth_token',
      'is_enabled',
      'config_json',
      'priority'
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

    const sql = `UPDATE service_providers SET ${updateFields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async updateConfig(provider_name, provider_type, updates) {
    const db = getDb();
    const allowedFields = [
      'api_endpoint',
      'api_key',
      'auth_token',
      'is_enabled',
      'config_json',
      'priority'
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
    updateValues.push(provider_name, provider_type);

    const sql = `UPDATE service_providers SET ${updateFields.join(', ')} WHERE provider_name = ? AND provider_type = ?`;

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
      db.run('DELETE FROM service_providers WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async deleteByName(provider_name, provider_type) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM service_providers WHERE provider_name = ? AND provider_type = ?',
        [provider_name, provider_type],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = ServiceProviderModel;
