// backend/api/handlers/map/avRouteAdjust.js
const { getAVRouteService } = require('../../../services/business/AVRouteService');

module.exports = async (c) => {
  console.log('🔍 [AV Route API] Adjust handler called');
  
  try {
    const { routeId, currentLat, currentLng, options = {} } = c.request.body;
    
    if (!routeId || currentLat == null || currentLng == null) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_PARAMETERS',
          message: 'Route ID and current coordinates are required'
        } 
      };
    }

    const avRouteService = getAVRouteService();
    const adjustedRoute = await avRouteService.adjustRoute(
      routeId,
      parseFloat(currentLat),
      parseFloat(currentLng),
      options
    );
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: adjustedRoute 
      } 
    };
  } catch (error) {
    console.error('❌ [AV Route API] Adjust error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'AV_ROUTE_ADJUSTMENT_FAILED',
        message: error.message 
      } 
    };
  }
};