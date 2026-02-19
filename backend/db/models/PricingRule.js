// backend/db/models/PricingRule.js
const { getDb } = require('../connection');

class PricingRuleModel {
  async create(ruleData) {
    const db = getDb();
    const {
      rule_name,
      base_price,
      price_per_km,
      price_per_hour,
      price_per_kg,
      cold_storage_surcharge,
      peak_hour_multiplier,
      off_peak_hour_multiplier,
      weather_multiplier,
      min_price,
      max_price,
      time_slot_rules,
      region_rules,
      vehicle_type_rules,
      active = 1
    } = ruleData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO platform_pricing_rules (
          rule_name, base_price, price_per_km, price_per_hour, price_per_kg,
          cold_storage_surcharge, peak_hour_multiplier, off_peak_hour_multiplier,
          weather_multiplier, min_price, max_price,
          time_slot_rules, region_rules, vehicle_type_rules, active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [rule_name, base_price, price_per_km, price_per_hour, price_per_kg,
         cold_storage_surcharge, peak_hour_multiplier, off_peak_hour_multiplier,
         weather_multiplier, min_price, max_price,
         JSON.stringify(time_slot_rules || {}),
         JSON.stringify(region_rules || {}),
         JSON.stringify(vehicle_type_rules || {}),
         active],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...ruleData });
        }
      );
    });
  }

  async findById(id) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM platform_pricing_rules WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        // 解析 JSON 字段
        if (row) {
          try {
            row.time_slot_rules = row.time_slot_rules ? JSON.parse(row.time_slot_rules) : {};
            row.region_rules = row.region_rules ? JSON.parse(row.region_rules) : {};
            row.vehicle_type_rules = row.vehicle_type_rules ? JSON.parse(row.vehicle_type_rules) : {};
          } catch (e) {
            console.error('解析定价规则 JSON 字段失败:', e);
          }
        }
        resolve(row);
      });
    });
  }

  async listAll(filters = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM platform_pricing_rules WHERE 1=1';
    const params = [];

    if (filters.active !== undefined) {
      sql += ' AND active = ?';
      params.push(filters.active);
    }

    sql += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        // 解析 JSON 字段
        rows.forEach(row => {
          try {
            row.time_slot_rules = row.time_slot_rules ? JSON.parse(row.time_slot_rules) : {};
            row.region_rules = row.region_rules ? JSON.parse(row.region_rules) : {};
            row.vehicle_type_rules = row.vehicle_type_rules ? JSON.parse(row.vehicle_type_rules) : {};
          } catch (e) {
            console.error('解析定价规则 JSON 字段失败:', e);
          }
        });
        resolve(rows);
      });
    });
  }

  async update(id, updates) {
    const db = getDb();
    const allowedFields = [
      'rule_name', 'base_price', 'price_per_km', 'price_per_hour', 'price_per_kg',
      'cold_storage_surcharge', 'peak_hour_multiplier', 'off_peak_hour_multiplier',
      'weather_multiplier', 'min_price', 'max_price',
      'time_slot_rules', 'region_rules', 'vehicle_type_rules', 'active'
    ];
    const updateFields = [];
    const updateValues = [];

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        if (['time_slot_rules', 'region_rules', 'vehicle_type_rules'].includes(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);

    const sql = `UPDATE platform_pricing_rules SET ${updateFields.join(', ')} WHERE id = ?`;

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
      db.run('DELETE FROM platform_pricing_rules WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  async getActiveRule() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM platform_pricing_rules WHERE active = 1 ORDER BY created_at DESC LIMIT 1',
        [],
        (err, row) => {
          if (err) return reject(err);
          // 解析 JSON 字段
          if (row) {
            try {
              row.time_slot_rules = row.time_slot_rules ? JSON.parse(row.time_slot_rules) : {};
              row.region_rules = row.region_rules ? JSON.parse(row.region_rules) : {};
              row.vehicle_type_rules = row.vehicle_type_rules ? JSON.parse(row.vehicle_type_rules) : {};
            } catch (e) {
              console.error('解析定价规则 JSON 字段失败:', e);
            }
          }
          resolve(row);
        }
      );
    });
  }
}

module.exports = PricingRuleModel;
