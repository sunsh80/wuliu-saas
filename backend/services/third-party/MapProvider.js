/**
 * 地图服务提供商抽象类
 */
class MapProvider {
  /**
   * 获取地图服务提供商名称
   * @returns {string} 服务提供商名称
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * 地理编码 - 将地址转换为坐标
   * @param {string} address 地址
   * @returns {Promise<{lat: number, lng: number}>} 坐标对象
   */
  geocode(address) {
    throw new Error('Method geocode() must be implemented');
  }

  /**
   * 逆地理编码 - 将坐标转换为地址
   * @param {number} lat 纬度
   * @param {number} lng 经度
   * @returns {Promise<string>} 地址字符串
   */
  reverseGeocode(lat, lng) {
    throw new Error('Method reverseGeocode() must be implemented');
  }

  /**
   * 计算两点间距离
   * @param {number} lat1 起始点纬度
   * @param {number} lng1 起始点经度
   * @param {number} lat2 目标点纬度
   * @param {number} lng2 目标点经度
   * @returns {Promise<number>} 距离(米)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    throw new Error('Method calculateDistance() must be implemented');
  }

  /**
   * 获取路线规划
   * @param {number} startLat 起始点纬度
   * @param {number} startLng 起始点经度
   * @param {number} endLat 目标点纬度
   * @param {number} endLng 目标点经度
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 路线信息
   */
  getRoute(startLat, startLng, endLat, endLng, options = {}) {
    throw new Error('Method getRoute() must be implemented');
  }

  /**
   * 获取交通路况信息
   * @param {number} lat 纬度
   * @param {number} lng 经度
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 交通路况信息
   */
  getTrafficInfo(lat, lng, options = {}) {
    throw new Error('Method getTrafficInfo() must be implemented');
  }

  /**
   * 获取附近POI
   * @param {number} lat 纬度
   * @param {number} lng 经度
   * @param {string} keyword 搜索关键词
   * @param {Object} options 可选参数
   * @returns {Promise<Array>} POI列表
   */
  searchNearbyPOI(lat, lng, keyword, options = {}) {
    throw new Error('Method searchNearbyPOI() must be implemented');
  }
}

module.exports = MapProvider;