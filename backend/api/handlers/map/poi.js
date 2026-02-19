// backend/api/handlers/map/poi.js
const { getMapService } = require('../../../services/business/MapService');

module.exports = async (c) => {
  console.log('🔍 [Map API] POI handler called');
  
  try {
    const { lat, lng, keyword, radius = 1000 } = c.request.query;
    
    if (!lat || !lng || !keyword) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_PARAMETERS',
          message: 'Coordinates and keyword are required'
        } 
      };
    }

    const mapService = getMapService();
    const pois = await mapService.searchNearbyPOI(
      parseFloat(lat),
      parseFloat(lng),
      keyword,
      { radius: parseInt(radius) }
    );
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: pois 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] POI error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'POI_SEARCH_FAILED',
        message: error.message 
      } 
    };
  }
};