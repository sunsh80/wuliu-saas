// backend/db/models/VehicleTracking.js
const { getDb } = require('../connection');

class VehicleTrackingModel {
  // 车辆位置追踪记录
  async createPosition(positionData) {
    const db = getDb();
    const {
      vehicle_id,
      plate_number,
      tenant_id,
      latitude,
      longitude,
      speed,
      direction,
      status = 'idle',
      address,
      accuracy
    } = positionData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO vehicle_positions (
          vehicle_id, plate_number, tenant_id,
          latitude, longitude, speed, direction, status, address, accuracy,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [vehicle_id, plate_number, tenant_id, latitude, longitude, speed, direction, status, address, accuracy],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...positionData });
        }
      );
    });
  }

  async getLatestPosition(vehicleId) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM vehicle_positions WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1',
        [vehicleId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  async listAllPositions(filters = {}) {
    const db = getDb();
    let sql = `
      SELECT vp.*, v.plate_number, v.tenant_id
      FROM vehicle_positions vp
      LEFT JOIN vehicles v ON vp.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.vehicle_id) {
      sql += ' AND vp.vehicle_id = ?';
      params.push(filters.vehicle_id);
    }
    if (filters.plate_number) {
      sql += ' AND v.plate_number LIKE ?';
      params.push(`%${filters.plate_number}%`);
    }
    if (filters.tenant_id) {
      sql += ' AND v.tenant_id = ?';
      params.push(filters.tenant_id);
    }
    if (filters.status) {
      sql += ' AND vp.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY vp.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getLatestPositionsForAllVehicles() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT vp.*, v.plate_number, v.tenant_id, t.name as tenant_name
        FROM vehicle_positions vp
        INNER JOIN vehicles v ON vp.vehicle_id = v.id
        INNER JOIN tenants t ON v.tenant_id = t.id
        WHERE vp.created_at = (
          SELECT MAX(created_at) 
          FROM vehicle_positions vp2 
          WHERE vp2.vehicle_id = vp.vehicle_id
        )
        ORDER BY vp.created_at DESC
      `, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getPositionHistory(vehicleId, startTime, endTime) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM vehicle_positions 
         WHERE vehicle_id = ? AND created_at BETWEEN ? AND ?
         ORDER BY created_at ASC`,
        [vehicleId, startTime, endTime],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async updateVehicleStatus(vehicleId, status, address) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE vehicles SET status = ?, current_address = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, address, vehicleId],
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
          COUNT(DISTINCT vehicle_id) as total_vehicles,
          SUM(CASE WHEN status = 'transporting' THEN 1 ELSE 0 END) as transporting_count,
          SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) as idle_count,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count
        FROM (
          SELECT vehicle_id, status
          FROM vehicle_positions
          WHERE created_at = (
            SELECT MAX(created_at) 
            FROM vehicle_positions vp2 
            WHERE vp2.vehicle_id = vehicle_positions.vehicle_id
          )
        )
      `, [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // 获取在线车辆（最近 5 分钟内有位置更新）
  async getOnlineVehicles() {
    const db = getDb();
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT vp.*, v.plate_number, v.tenant_id, t.name as tenant_name
        FROM vehicle_positions vp
        INNER JOIN vehicles v ON vp.vehicle_id = v.id
        INNER JOIN tenants t ON v.tenant_id = t.id
        WHERE vp.created_at >= datetime('now', '-5 minutes')
        ORDER BY vp.created_at DESC
      `, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = VehicleTrackingModel;
