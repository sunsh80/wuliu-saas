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