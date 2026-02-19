// backend/api/handlers/map/avRouteCalculate.js
const { getAVRouteService } = require('../../../services/business/AVRouteService');

module.exports = async (c) => {
  console.log('🔍 [AV Route API] Calculate handler called');
  
  try {
    const { startLat, startLng, endLat, endLng, options = {} } = c.request.body;
    
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

    const avRouteService = getAVRouteService();
    const route = await avRouteService.getAVRoute(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng),
      options
    );
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: route 
      } 
    };
  } catch (error) {
    console.error('❌ [AV Route API] Calculate error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'AV_ROUTE_CALCULATION_FAILED',
        message: error.message 
      } 
    };
  }
};