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
      destinations: `${lat2},${lng2}`
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