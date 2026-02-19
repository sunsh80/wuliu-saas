const VehicleTrackingProvider = require('../third-party/VehicleTrackingProvider');
const {getDb} = require('../../db/index'); // 使用项目中的数据库连接

class VehicleCompanyTracking extends VehicleTrackingProvider {
  constructor(config) {
    super();
    this.apiEndpoint = config.apiEndpoint;
    this.authToken = config.authToken;
  }

  getName() {
    return 'VehicleCompanyTracking';
  }

  async initializeTracking(vehicleId) {
    try {
      const db = getDb();
      
      // 在数据库中初始化车辆状态
      await db.run(
        `INSERT OR REPLACE INTO vehicle_tracking 
         (vehicle_id, status, last_update, lat, lng) 
         VALUES (?, ?, datetime('now'), ?, ?)`,
        [vehicleId, 'offline', null, null]
      );

      console.log(`Initializing tracking for vehicle: ${vehicleId}`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize tracking for vehicle ${vehicleId}:`, error);
      return false;
    }
  }

  async receiveLocationUpdate(vehicleId, lat, lng, timestamp, additionalData) {
    try {
      const db = getDb();
      
      // 存储实时位置到数据库
      const battery = additionalData?.battery || null;
      const speed = additionalData?.speed || null;
      const heading = additionalData?.heading || null;
      const status = additionalData?.status || 'online';

      await db.run(
        `INSERT INTO vehicle_positions 
         (vehicle_id, lat, lng, timestamp, battery, speed, heading, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [vehicleId, lat, lng, timestamp, battery, speed, heading, status]
      );

      // 更新车辆最新位置
      await db.run(
        `UPDATE vehicle_tracking 
         SET lat = ?, lng = ?, status = ?, last_update = datetime('now'), battery = ?
         WHERE vehicle_id = ?`,
        [lat, lng, status, battery, vehicleId]
      );

      console.log(`Received location update for vehicle ${vehicleId}: ${lat}, ${lng}`);

      // 触发位置更新事件
      this._triggerLocationUpdateEvent(vehicleId, {
        lat,
        lng,
        timestamp,
        battery,
        speed,
        heading,
        status
      });
    } catch (error) {
      console.error(`Failed to process location update for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getHistoricalTrajectory(vehicleId, startTime, endTime) {
    try {
      const db = getDb();

      const trajectoryPoints = await db.all(
        `SELECT vehicle_id, lat, lng, timestamp, battery, speed, heading, status
         FROM vehicle_positions 
         WHERE vehicle_id = ? AND timestamp BETWEEN ? AND ?
         ORDER BY timestamp ASC`,
        [vehicleId, startTime, endTime]
      );

      return trajectoryPoints;
    } catch (error) {
      console.error(`Failed to get historical trajectory for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getCurrentVehicleStatus(vehicleId) {
    try {
      const db = getDb();
      
      const status = await db.get(
        `SELECT vehicle_id, lat, lng, status, last_update, battery, speed, heading
         FROM vehicle_tracking 
         WHERE vehicle_id = ?`,
        [vehicleId]
      );

      if (!status) {
        throw new Error(`Vehicle ${vehicleId} not found`);
      }

      return {
        vehicleId: status.vehicle_id,
        online: status.status === 'online',
        lastPosition: {
          lat: status.lat ? parseFloat(status.lat) : null,
          lng: status.lng ? parseFloat(status.lng) : null,
          timestamp: status.last_update
        },
        battery: status.battery ? parseFloat(status.battery) : null,
        speed: status.speed ? parseFloat(status.speed) : null,
        heading: status.heading ? parseFloat(status.heading) : null
      };
    } catch (error) {
      console.error(`Failed to get current status for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  setLocationUpdateCallback(callback) {
    // 设置内部回调函数
    this.locationUpdateCallback = callback;
  }

  async getOnlineStatus(vehicleId) {
    try {
      const db = getDb();
      const result = await db.get(
        `SELECT status FROM vehicle_tracking WHERE vehicle_id = ?`,
        [vehicleId]
      );
      
      return result && result.status === 'online';
    } catch (error) {
      console.error(`Failed to get online status for vehicle ${vehicleId}:`, error);
      return false;
    }
  }

  // 内部方法：触发位置更新事件
  _triggerLocationUpdateEvent(vehicleId, positionData) {
    if (this.locationUpdateCallback) {
      this.locationUpdateCallback(vehicleId, positionData);
    }

    // 这里可以发布到消息队列或WebSocket等
    // 以便实时推送到前端
  }
}

module.exports = VehicleCompanyTracking;