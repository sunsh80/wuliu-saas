# 第三方地图服务集成开发文档

## 1. 概述

本文档描述了物流系统中第三方地图服务的集成方案，包括腾讯地图和百度地图的接入、无人车路径规划服务集成以及车辆位置回传服务集成。

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   小程序前端     │    │      后端服务        │    │  第三方服务商    │
│                 │    │                      │    │                 │
│  ┌───────────┐  │    │  ┌─────────────────┐ │    │ ┌─────────────┐ │
│  │地图显示组件│  │◄───┼──┤  地图服务抽象层  │ │◄───┼─┤  腾讯地图   │ │
│  └───────────┘  │    │  └─────────────────┘ │    │ └─────────────┘ │
│                 │    │         ▲             │    │                 │
│  ┌───────────┐  │    │         │             │    │ ┌─────────────┐ │
│  │订单跟踪页 │  │◄───┼─────────┼─────────────┼────┼─┤  百度地图   │ │
│  └───────────┘  │    │         │             │    │ └─────────────┘ │
└─────────────────┘    │  ┌─────────────────┐ │    │                 │
                       │  │无人车路径规划抽象│ │    │ ┌─────────────┐ │
                       │  └─────────────────┘ │◄───┼─┤  AutoX路径  │ │
                       │         ▲             │    │ └─────────────┘ │
                       │         │             │    │                 │
                       │  ┌─────────────────┐ │    │ ┌─────────────┐ │
                       │  │车辆位置回传抽象 │ │◄───┼─┤  车辆公司   │ │
                       │  └─────────────────┘ │    │ └─────────────┘ │
                       │         ▲             │    │                 │
                       │  ┌─────────────────┐ │    │ ┌─────────────┐ │
                       │  │   业务服务层     │ │    │ │  定位公司   │ │
                       │  └─────────────────┘ │    │ └─────────────┘ │
                       └──────────────────────┘    └─────────────────┘
```

### 2.2 技术栈

- **后端**: Node.js, Express
- **数据库**: SQLite/MySQL
- **缓存**: Redis
- **地图服务**: 腾讯地图、百度地图
- **无人车路径规划**: AutoX、Neoway
- **车辆位置回传**: 车辆公司、定位公司API

## 3. 地图服务抽象层设计

### 3.1 MapProvider 抽象类

```javascript
// backend/services/third-party/MapProvider.js
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
```

### 3.2 腾讯地图实现

```javascript
// backend/services/providers/TencentMap.js
const MapProvider = require('../third-party/MapProvider');
const axios = require('axios');

class TencentMap extends MapProvider {
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://apis.map.qq.com/ws';
  }

  getName() {
    return 'TencentMap';
  }

  async geocode(address) {
    const url = `${this.baseUrl}/geocoder/v1/`;
    const params = {
      address,
      key: this.apiKey
    };

    try {
      const response = await axios.get(url, { params });
      const result = response.data.result;
      return {
        lat: result.location.lat,
        lng: result.location.lng
      };
    } catch (error) {
      throw new Error(`Tencent Map geocoding failed: ${error.message}`);
    }
  }

  async reverseGeocode(lat, lng) {
    const url = `${this.baseUrl}/geocoder/v1/`;
    const params = {
      location: `${lat},${lng}`,
      key: this.apiKey,
      get_poi: 1
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.address;
    } catch (error) {
      throw new Error(`Tencent Map reverse geocoding failed: ${error.message}`);
    }
  }

  async calculateDistance(lat1, lng1, lat2, lng2) {
    const url = `${this.baseUrl}/distance/v1/`;
    const params = {
      mode: 'driving',
      from: `${lat1},${lng1}`,
      to: `${lat2},${lng2}`,
      key: this.apiKey
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.elements[0].distance;
    } catch (error) {
      throw new Error(`Tencent Map distance calculation failed: ${error.message}`);
    }
  }

  async getRoute(startLat, startLng, endLat, endLng, options = {}) {
    const url = `${this.baseUrl}/direction/v1/`;
    const params = {
      mode: 'driving',
      from: `${startLat},${startLng}`,
      to: `${endLat},${endLng}`,
      key: this.apiKey,
      ...options
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.routes[0];
    } catch (error) {
      throw new Error(`Tencent Map route calculation failed: ${error.message}`);
    }
  }

  async getTrafficInfo(lat, lng, options = {}) {
    // 腾讯地图交通路况信息实现
    throw new Error('Traffic info not implemented for Tencent Map');
  }

  async searchNearbyPOI(lat, lng, keyword, options = {}) {
    const url = `${this.baseUrl}/place/v1/search`;
    const params = {
      boundary: `nearby(${lat},${lng},${options.radius || 1000})`,
      keyword,
      key: this.apiKey,
      page_size: options.pageSize || 10,
      page_index: options.pageIndex || 1
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.data;
    } catch (error) {
      throw new Error(`Tencent Map POI search failed: ${error.message}`);
    }
  }
}

module.exports = TencentMap;
```

### 3.3 百度地图实现

```javascript
// backend/services/providers/BaiduMap.js
const MapProvider = require('../third-party/MapProvider');
const axios = require('axios');

class BaiduMap extends MapProvider {
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.map.baidu.com';
  }

  getName() {
    return 'BaiduMap';
  }

  async geocode(address) {
    const url = `${this.baseUrl}/geocoding/v3/`;
    const params = {
      address,
      output: 'json',
      ak: this.apiKey
    };

    try {
      const response = await axios.get(url, { params });
      const result = response.data.result.location;
      return {
        lat: result.lat,
        lng: result.lng
      };
    } catch (error) {
      throw new Error(`Baidu Map geocoding failed: ${error.message}`);
    }
  }

  async reverseGeocode(lat, lng) {
    const url = `${this.baseUrl}/reverse_geocoding/v3/`;
    const params = {
      coordtype: 'bd09ll',
      output: 'json',
      ak: this.apiKey,
      location: `${lat},${lng}`
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.formatted_address;
    } catch (error) {
      throw new Error(`Baidu Map reverse geocoding failed: ${error.message}`);
    }
  }

  async calculateDistance(lat1, lng1, lat2, lng2) {
    const url = `${this.baseUrl}/direction/v2/routematrix`;
    const params = {
      ak: this.apiKey,
      output: 'json',
      origins: `${lat1},${lng1}`,
      destinations: `${lng2},${lng2}`
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.rows[0].elements[0].distance.value;
    } catch (error) {
      throw new Error(`Baidu Map distance calculation failed: ${error.message}`);
    }
  }

  async getRoute(startLat, startLng, endLat, endLng, options = {}) {
    const url = `${this.baseUrl}/direction/v2/driving`;
    const params = {
      origin: `${startLat},${startLng}`,
      destination: `${endLat},${endLng}`,
      ak: this.apiKey,
      output: 'json',
      ...options
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.result.routes[0];
    } catch (error) {
      throw new Error(`Baidu Map route calculation failed: ${error.message}`);
    }
  }

  async getTrafficInfo(lat, lng, options = {}) {
    // 百度地图交通路况信息实现
    throw new Error('Traffic info not implemented for Baidu Map');
  }

  async searchNearbyPOI(lat, lng, keyword, options = {}) {
    const url = `${this.baseUrl}/place/v2/search`;
    const params = {
      query: keyword,
      location: `${lat},${lng}`,
      radius: options.radius || 1000,
      output: 'json',
      ak: this.apiKey,
      page_size: options.pageSize || 10,
      page_num: options.pageIndex || 0
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.results;
    } catch (error) {
      throw new Error(`Baidu Map POI search failed: ${error.message}`);
    }
  }
}

module.exports = BaiduMap;
```

## 4. 无人车路径规划服务

### 4.1 AVRouteProvider 抽象类

```javascript
// backend/services/third-party/AVRouteProvider.js
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
```

### 4.2 AutoX 路径规划实现

```javascript
// backend/services/providers/AutoXAVRoute.js
const AVRouteProvider = require('../third-party/AVRouteProvider');
const axios = require('axios');

class AutoXAVRoute extends AVRouteProvider {
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.autox.com';
  }

  getName() {
    return 'AutoXAVRoute';
  }

  async getAVRoute(startLat, startLng, endLat, endLng, options = {}) {
    const url = `${this.baseUrl}/route/calculate`;
    const payload = {
      start: { lat: startLat, lng: startLng },
      end: { lat: endLat, lng: endLng },
      vehicle_type: options.vehicleType || 'delivery_robot',
      avoid_area: options.avoidArea || [],
      ...options
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`AutoX route calculation failed: ${error.message}`);
    }
  }

  async getMultiPointRoute(points, options = {}) {
    const url = `${this.baseUrl}/route/multi-point`;
    const payload = {
      waypoints: points.map(point => ({ lat: point.lat, lng: point.lng })),
      vehicle_type: options.vehicleType || 'delivery_robot',
      avoid_area: options.avoidArea || [],
      ...options
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`AutoX multi-point route calculation failed: ${error.message}`);
    }
  }

  async getRouteDetails(routeId) {
    const url = `${this.baseUrl}/route/details/${routeId}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`AutoX route details retrieval failed: ${error.message}`);
    }
  }

  async adjustRoute(routeId, currentLat, currentLng, options = {}) {
    const url = `${this.baseUrl}/route/adjust`;
    const payload = {
      route_id: routeId,
      current_location: { lat: currentLat, lng: currentLng },
      reason: options.reason || 'traffic_jam',
      ...options
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`AutoX route adjustment failed: ${error.message}`);
    }
  }
}

module.exports = AutoXAVRoute;
```

## 5. 车辆位置回传服务

### 5.1 VehicleTrackingProvider 抽象类

```javascript
// backend/services/third-party/VehicleTrackingProvider.js
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
```

### 5.2 车辆公司位置回传实现

```javascript
// backend/services/providers/VehicleCompanyTracking.js
const VehicleTrackingProvider = require('../third-party/VehicleTrackingProvider');
const redis = require('../../db'); // 假设使用Redis存储实时位置

class VehicleCompanyTracking extends VehicleTrackingProvider {
  constructor(config) {
    super();
    this.apiEndpoint = config.apiEndpoint;
    this.authToken = config.authToken;
    this.redisClient = redis;
  }

  getName() {
    return 'VehicleCompanyTracking';
  }

  async initializeTracking(vehicleId) {
    // 注册车辆到位置回传系统
    try {
      // 这里可能需要向车辆公司API注册车辆
      // 或者建立长连接监听位置更新
      console.log(`Initializing tracking for vehicle: ${vehicleId}`);
      
      // 在Redis中初始化车辆状态
      await this.redisClient.hset(`vehicle:${vehicleId}`, {
        status: 'offline',
        last_update: Date.now(),
        lat: null,
        lng: null
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to initialize tracking for vehicle ${vehicleId}:`, error);
      return false;
    }
  }

  async receiveLocationUpdate(vehicleId, lat, lng, timestamp, additionalData) {
    try {
      // 存储实时位置到Redis
      const vehicleKey = `vehicle:${vehicleId}`;
      const positionData = {
        lat,
        lng,
        timestamp,
        status: 'online',
        battery: additionalData.battery || null,
        speed: additionalData.speed || null,
        heading: additionalData.heading || null
      };
      
      await this.redisClient.hset(vehicleKey, positionData);
      
      // 存储轨迹点到有序集合（按时间排序）
      const trajectoryKey = `trajectory:${vehicleId}`;
      await this.redisClient.zadd(trajectoryKey, timestamp, JSON.stringify({
        lat,
        lng,
        timestamp,
        ...additionalData
      }));
      
      // 设置过期时间（例如保留最近24小时的数据）
      await this.redisClient.expire(trajectoryKey, 86400); // 24小时
      
      console.log(`Received location update for vehicle ${vehicleId}: ${lat}, ${lng}`);
      
      // 触发位置更新事件
      this._triggerLocationUpdateEvent(vehicleId, positionData);
    } catch (error) {
      console.error(`Failed to process location update for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getHistoricalTrajectory(vehicleId, startTime, endTime) {
    try {
      const trajectoryKey = `trajectory:${vehicleId}`;
      
      // 获取指定时间范围内的轨迹点
      const trajectoryPoints = await this.redisClient.zrangebyscore(
        trajectoryKey, 
        startTime, 
        endTime
      );
      
      return trajectoryPoints.map(pointStr => JSON.parse(pointStr));
    } catch (error) {
      console.error(`Failed to get historical trajectory for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getCurrentVehicleStatus(vehicleId) {
    try {
      const vehicleKey = `vehicle:${vehicleId}`;
      const status = await this.redisClient.hgetall(vehicleKey);
      
      return {
        vehicleId,
        online: status.status === 'online',
        lastPosition: {
          lat: parseFloat(status.lat),
          lng: parseFloat(status.lng),
          timestamp: parseInt(status.timestamp)
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
      const vehicleKey = `vehicle:${vehicleId}`;
      const status = await this.redisClient.hget(vehicleKey, 'status');
      return status === 'online';
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
```

## 6. 后端API接口

### 6.1 地图相关API

```javascript
// backend/api/routes/index.js
const express = require('express');
const router = express.Router();
const { getMapService } = require('../../services/business/MapService');

// 地理编码
router.get('/map/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }
    
    const mapService = getMapService();
    const coordinates = await mapService.geocode(address);
    res.json({ success: true, data: coordinates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 路径规划
router.get('/map/route', async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: 'Start and end coordinates are required' });
    }
    
    const mapService = getMapService();
    const route = await mapService.getRoute(
      parseFloat(startLat), 
      parseFloat(startLng), 
      parseFloat(endLat), 
      parseFloat(endLng)
    );
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 距离计算
router.get('/map/distance', async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({ error: 'Both coordinate pairs are required' });
    }
    
    const mapService = getMapService();
    const distance = await mapService.calculateDistance(
      parseFloat(lat1), 
      parseFloat(lng1), 
      parseFloat(lat2), 
      parseFloat(lng2)
    );
    res.json({ success: true, data: { distance } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POI搜索
router.get('/map/poi', async (req, res) => {
  try {
    const { lat, lng, keyword, radius = 1000 } = req.query;
    if (!lat || !lng || !keyword) {
      return res.status(400).json({ error: 'Coordinates and keyword are required' });
    }
    
    const mapService = getMapService();
    const pois = await mapService.searchNearbyPOI(
      parseFloat(lat), 
      parseFloat(lng), 
      keyword, 
      { radius: parseInt(radius) }
    );
    res.json({ success: true, data: pois });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 停靠点管理
router.get('/map/stop-points', async (req, res) => {
  try {
    const { region, type, limit = 50 } = req.query;
    const StopPoint = require('../../db/models/StopPoint');
    
    let query = {};
    if (region) query.region = region;
    if (type) query.type = type;
    
    const stopPoints = await StopPoint.findAll({
      where: query,
      limit: parseInt(limit)
    });
    
    res.json({ success: true, data: stopPoints });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 无人车路径规划
router.post('/av-route/calculate', async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, options = {} } = req.body;
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: 'Start and end coordinates are required' });
    }
    
    const avRouteService = require('../../services/business/AVRouteService');
    const route = await avRouteService.getAVRoute(
      parseFloat(startLat), 
      parseFloat(startLng), 
      parseFloat(endLat), 
      parseFloat(endLng), 
      options
    );
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 车辆位置更新（供第三方回调）
router.post('/tracking/position-update', async (req, res) => {
  try {
    const { vehicleId, lat, lng, timestamp, additionalData } = req.body;
    if (!vehicleId || lat == null || lng == null) {
      return res.status(400).json({ error: 'Vehicle ID and coordinates are required' });
    }
    
    const trackingService = require('../../services/business/TrackingService');
    await trackingService.receiveLocationUpdate(
      vehicleId, 
      parseFloat(lat), 
      parseFloat(lng), 
      timestamp || Date.now(), 
      additionalData || {}
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取车辆当前位置
router.get('/tracking/current-position/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const trackingService = require('../../services/business/TrackingService');
    const status = await trackingService.getCurrentVehicleStatus(vehicleId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 7. 前端集成

### 7.1 小程序地图显示组件

```javascript
// wx-program/components/map-display/map-display.js
Component({
  properties: {
    markers: {
      type: Array,
      value: []
    },
    polyline: {
      type: Array,
      value: []
    },
    centerLat: {
      type: Number,
      value: 39.909
    },
    centerLng: {
      type: Number,
      value: 116.39742
    },
    zoom: {
      type: Number,
      value: 16
    }
  },

  data: {
    scale: 16
  },

  methods: {
    onRegionChange(e) {
      // 地图区域变化事件
      if (e.type === 'end') {
        this.triggerEvent('regionchange', e.detail);
      }
    },

    onMarkerTap(e) {
      // 标记点点击事件
      this.triggerEvent('markertap', {
        markerId: e.markerId
      });
    },

    onLoadSuccess(e) {
      // 地图加载成功事件
      this.triggerEvent('loadsuccess', e.detail);
    },

    updateMarkers(newMarkers) {
      // 更新标记点
      this.setData({
        markers: newMarkers
      });
    },

    updatePolyline(newPolyline) {
      // 更新路线
      this.setData({
        polyline: newPolyline
      });
    }
  }
});
```

### 7.2 小程序地图页面

```javascript
// wx-program/pages/order-track/map-view.js
Page({
  data: {
    orderId: '',
    vehiclePosition: null,
    deliveryRoute: [],
    markers: [],
    polyline: []
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId
    });
    
    // 加载订单信息和配送路线
    this.loadOrderInfo();
    
    // 开始监听车辆位置
    this.startVehicleTracking();
  },

  async loadOrderInfo() {
    try {
      const orderResponse = await wx.request({
        url: `/api/order/getOrder?id=${this.data.orderId}`,
        method: 'GET'
      });
      
      const order = orderResponse.data.data;
      this.updateMapWithOrderInfo(order);
    } catch (error) {
      console.error('Failed to load order info:', error);
    }
  },

  updateMapWithOrderInfo(order) {
    const markers = [
      // 取货点标记
      {
        id: 1,
        latitude: order.pickupLat,
        longitude: order.pickupLng,
        iconPath: '/assets/icons/pickup.png',
        width: 30,
        height: 30,
        title: '取货点'
      },
      // 收货点标记
      {
        id: 2,
        latitude: order.deliveryLat,
        longitude: order.deliveryLng,
        iconPath: '/assets/icons/delivery.png',
        width: 30,
        height: 30,
        title: '收货点'
      }
    ];
    
    // 如果有车辆位置，添加车辆标记
    if (this.data.vehiclePosition) {
      markers.push({
        id: 3,
        latitude: this.data.vehiclePosition.lat,
        longitude: this.data.vehiclePosition.lng,
        iconPath: '/assets/icons/vehicle.png',
        width: 25,
        height: 25,
        title: '配送中'
      });
    }
    
    this.setData({
      markers
    });
  },

  startVehicleTracking() {
    // 使用WebSocket或其他方式实时获取车辆位置
    const socket = wx.connectSocket({
      url: `ws://your-server.com/ws/vehicle-tracking/${this.data.orderId}`
    });

    socket.onMessage((res) => {
      const data = JSON.parse(res.data);
      if (data.type === 'location_update') {
        this.updateVehiclePosition(data.payload);
      }
    });
  },

  updateVehiclePosition(position) {
    this.setData({
      vehiclePosition: position
    });
    
    // 更新地图上的标记
    this.updateMapWithOrderInfo({});
  },

  onUnload() {
    // 清理资源
    if (this.socket) {
      this.socket.close();
    }
  }
});
```

## 8. 配置管理

### 8.1 地图服务配置

```javascript
// backend/config/map.js
module.exports = {
  defaultProvider: process.env.MAP_PROVIDER || 'TencentMap', // 默认地图提供商
  
  providers: {
    TencentMap: {
      apiKey: process.env.TENCENT_MAP_API_KEY,
      enabled: process.env.TENCENT_MAP_ENABLED !== 'false'
    },
    BaiduMap: {
      apiKey: process.env.BAIDU_MAP_API_KEY,
      enabled: process.env.BAIDU_MAP_ENABLED !== 'false'
    }
  },
  
  // 地理编码缓存配置
  geocodeCache: {
    enabled: true,
    ttl: 86400, // 24小时
    maxSize: 1000
  },
  
  // 请求频率限制
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1分钟
  }
};
```

### 8.2 无人车路径规划配置

```javascript
// backend/config/av-route.js
module.exports = {
  defaultProvider: process.env.AV_ROUTE_PROVIDER || 'AutoXAVRoute', // 默认路径规划提供商
  
  providers: {
    AutoXAVRoute: {
      apiKey: process.env.AUTOX_AV_ROUTE_API_KEY,
      baseUrl: process.env.AUTOX_AV_ROUTE_BASE_URL || 'https://api.autox.com',
      enabled: process.env.AUTOX_AV_ROUTE_ENABLED !== 'false'
    },
    NeowayAVRoute: {
      apiKey: process.env.NEOWAY_AV_ROUTE_API_KEY,
      baseUrl: process.env.NEOWAY_AV_ROUTE_BASE_URL || 'https://api.neoway.com',
      enabled: process.env.NEOWAY_AV_ROUTE_ENABLED !== 'false'
    }
  },
  
  // 路径规划缓存配置
  routeCache: {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 500
  },
  
  // 路径规划请求频率限制
  rateLimit: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 1分钟
  }
};
```

### 8.3 车辆位置回传配置

```javascript
// backend/config/tracking.js
module.exports = {
  defaultProvider: process.env.TRACKING_PROVIDER || 'VehicleCompanyTracking', // 默认位置回传提供商
  
  providers: {
    VehicleCompanyTracking: {
      apiEndpoint: process.env.VEHICLE_COMPANY_API_ENDPOINT,
      authToken: process.env.VEHICLE_COMPANY_AUTH_TOKEN,
      enabled: process.env.VEHICLE_COMPANY_TRACKING_ENABLED !== 'false'
    },
    LocationServiceProvider: {
      apiEndpoint: process.env.LOCATION_SERVICE_API_ENDPOINT,
      authToken: process.env.LOCATION_SERVICE_AUTH_TOKEN,
      enabled: process.env.LOCATION_SERVICE_TRACKING_ENABLED !== 'false'
    }
  },
  
  // 位置数据存储配置
  storage: {
    retentionDays: 30, // 数据保留天数
    batchSize: 100, // 批量处理大小
    enableCompression: true
  },
  
  // WebSocket连接配置
  websocket: {
    heartbeatInterval: 30000, // 心跳间隔（毫秒）
    reconnectAttempts: 5, // 重连尝试次数
    reconnectDelay: 1000 // 重连延迟（毫秒）
  }
};
```

## 9. 数据模型

### 9.1 停靠点模型

```javascript
// backend/db/models/StopPoint.js
const { DataTypes } = require('sequelize');
const sequelize = require('../index'); // 假设这是sequelize实例

const StopPoint = sequelize.define('StopPoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial', 'other'),
    defaultValue: 'other'
  },
  region: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  description: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stop_points',
  timestamps: true
});

module.exports = StopPoint;
```

## 10. 错误处理与日志

### 10.1 统一错误处理

```javascript
// backend/utils/errorHandler.js
class MapServiceError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'MapServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

class AVRouteServiceError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'AVRouteServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

class TrackingServiceError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'TrackingServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

module.exports = {
  MapServiceError,
  AVRouteServiceError,
  TrackingServiceError
};
```

### 10.2 日志记录

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'map-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

## 11. 测试

### 11.1 单元测试示例

```javascript
// backend/tests/unit/map-service.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const TencentMap = require('../../services/providers/TencentMap');

describe('TencentMap Service', () => {
  let tencentMap;

  beforeEach(() => {
    tencentMap = new TencentMap({ apiKey: 'test-key' });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getName', () => {
    it('should return correct provider name', () => {
      expect(tencentMap.getName()).to.equal('TencentMap');
    });
  });

  describe('geocode', () => {
    it('should call Tencent Map API with correct parameters', async () => {
      const mockAxios = require('axios');
      const stub = sinon.stub(mockAxios, 'get').resolves({
        data: {
          result: {
            location: { lat: 39.909, lng: 116.397 }
          }
        }
      });

      const result = await tencentMap.geocode('北京市中心');
      
      expect(stub.calledOnce).to.be.true;
      expect(result).to.deep.equal({ lat: 39.909, lng: 116.397 });
    });
  });
});
```

## 12. 部署与运维

### 12.1 环境变量配置

```bash
# .env
# 地图服务配置
MAP_PROVIDER=TencentMap
TENCENT_MAP_API_KEY=your_tencent_map_api_key
BAIDU_MAP_API_KEY=your_baidu_map_api_key
TENCENT_MAP_ENABLED=true
BAIDU_MAP_ENABLED=true

# 无人车路径规划配置
AV_ROUTE_PROVIDER=AutoXAVRoute
AUTOX_AV_ROUTE_API_KEY=your_autox_api_key
AUTOX_AV_ROUTE_BASE_URL=https://api.autox.com
AUTOX_AV_ROUTE_ENABLED=true

# 车辆位置回传配置
TRACKING_PROVIDER=VehicleCompanyTracking
VEHICLE_COMPANY_API_ENDPOINT=https://api.vehicle-company.com
VEHICLE_COMPANY_AUTH_TOKEN=your_auth_token
VEHICLE_COMPANY_TRACKING_ENABLED=true

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=logistics_db
DB_USER=root
DB_PASS=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 12.2 Docker配置

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: logistics_db
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:alpine
    restart: unless-stopped

volumes:
  db_data:
```

这份完整的第三方地图服务集成开发文档涵盖了从架构设计到具体实现的所有方面，包括地图服务、无人车路径规划服务和车辆位置回传服务的集成方案。文档提供了详细的代码示例、配置选项和部署指导，可以作为开发团队实施此功能的参考指南。