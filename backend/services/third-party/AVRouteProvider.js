/**
 * 无人车路径规划服务提供商抽象类
 */
class AVRouteProvider {
  /**
   * 获取无人车路径规划服务提供商名称
   * @returns {string} 服务提供商名称
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * 获取无人车专用路径规划
   * @param {number} startLat 起始点纬度
   * @param {number} startLng 起始点经度
   * @param {number} endLat 目标点纬度
   * @param {number} endLng 目标点经度
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 路径规划结果
   */
  getAVRoute(startLat, startLng, endLat, endLng, options = {}) {
    throw new Error('Method getAVRoute() must be implemented');
  }

  /**
   * 获取多点路径规划（支持中途停靠点）
   * @param {Array} points 坐标点数组 [{lat, lng}]
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 路径规划结果
   */
  getMultiPointRoute(points, options = {}) {
    throw new Error('Method getMultiPointRoute() must be implemented');
  }

  /**
   * 获取路径规划详情（包括限行区域、特殊路段等）
   * @param {string} routeId 路径规划ID
   * @returns {Promise<Object>} 路径详情
   */
  getRouteDetails(routeId) {
    throw new Error('Method getRouteDetails() must be implemented');
  }

  /**
   * 实时路径调整（考虑交通状况、临时障碍等）
   * @param {string} routeId 路径规划ID
   * @param {number} currentLat 当前纬度
   * @param {number} currentLng 当前经度
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 调整后的路径
   */
  adjustRoute(routeId, currentLat, currentLng, options = {}) {
    throw new Error('Method adjustRoute() must be implemented');
  }
}

module.exports = AVRouteProvider;