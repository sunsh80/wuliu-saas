// backend/api/handlers/map/geocode.js
const { getMapService } = require('../../../services/business/MapService');

module.exports = async (c) => {
  console.log('🔍 [Map API] Geocode handler called');
  
  try {
    const { address } = c.request.query;
    
    if (!address) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_ADDRESS_PARAMETER',
          message: 'Address parameter is required'
        } 
      };
    }

    const mapService = getMapService();
    const coordinates = await mapService.geocode(address);
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: coordinates 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] Geocode error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'GEOCODE_FAILED',
        message: error.message 
      } 
    };
  }
};