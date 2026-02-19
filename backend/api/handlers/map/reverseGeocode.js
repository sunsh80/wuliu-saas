// backend/api/handlers/map/reverseGeocode.js
const { getMapService } = require('../../../services/business/MapService');

module.exports = async (c) => {
  console.log('🔍 [Map API] Reverse Geocode handler called');
  
  try {
    const { lat, lng } = c.request.query;
    
    if (!lat || !lng) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_COORDINATES_PARAMETER',
          message: 'Latitude and longitude parameters are required'
        } 
      };
    }

    const mapService = getMapService();
    const address = await mapService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: address 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] Reverse Geocode error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'REVERSE_GEOCODE_FAILED',
        message: error.message 
      } 
    };
  }
};