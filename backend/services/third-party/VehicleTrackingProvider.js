/**
 * 车辆位置回传服务提供商抽象类
 */
class VehicleTrackingProvider {
  /**
   * 获取车辆位置回传服务提供商名称
   * @returns {string} 服务提供商名称
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * 初始化车辆位置监听
   * @param {string} vehicleId 车辆ID
   * @returns {Promise<boolean>} 是否成功
   */
  initializeTracking(vehicleId) {
    throw new Error('Method initializeTracking() must be implemented');
  }

  /**
   * 接收车辆实时位置信息
   * @param {string} vehicleId 车辆ID
   * @param {number} lat 纬度
   * @param {number} lng 经度
   * @param {number} timestamp 时间戳
   * @param {Object} additionalData 额外数据
   * @returns {Promise<void>}
   */
  receiveLocationUpdate(vehicleId, lat, lng, timestamp, additionalData) {
    throw new Error('Method receiveLocationUpdate() must be implemented');
  }

  /**
   * 获取车辆历史轨迹
   * @param {string} vehicleId 车辆ID
   * @param {number} startTime 开始时间戳
   * @param {number} endTime 结束时间戳
   * @returns {Promise<Array>} 轨迹点数组
   */
  getHistoricalTrajectory(vehicleId, startTime, endTime) {
    throw new Error('Method getHistoricalTrajectory() must be implemented');
  }

  /**
   * 获取车辆当前状态
   * @param {string} vehicleId 车辆ID
   * @returns {Promise<Object>} 车辆状态信息
   */
  getCurrentVehicleStatus(vehicleId) {
    throw new Error('Method getCurrentVehicleStatus() must be implemented');
  }

  /**
   * 设置位置更新回调
   * @param {Function} callback 回调函数
   * @returns {void}
   */
  setLocationUpdateCallback(callback) {
    throw new Error('Method setLocationUpdateCallback() must be implemented');
  }

  /**
   * 获取车辆在线状态
   * @param {string} vehicleId 车辆ID
   * @returns {Promise<boolean>} 是否在线
   */
  getOnlineStatus(vehicleId) {
    throw new Error('Method getOnlineStatus() must be implemented');
  }
}

module.exports = VehicleTrackingProvider;