// backend/api/handlers/map/route.js
const { getMapService } = require('../../../services/business/MapService');

module.exports = async (c) => {
  console.log('🔍 [Map API] Route handler called');
  
  try {
    const { startLat, startLng, endLat, endLng } = c.request.query;
    
    if (!startLat || !startLng || !endLat || !endLng) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_COORDINATES_PARAMETER',
          message: 'Start and end coordinates are required'
        } 
      };
    }

    const mapService = getMapService();
    const route = await mapService.getRoute(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    );
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: route 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] Route error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'ROUTE_CALCULATION_FAILED',
        message: error.message 
      } 
    };
  }
};