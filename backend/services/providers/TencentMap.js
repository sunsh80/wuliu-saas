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