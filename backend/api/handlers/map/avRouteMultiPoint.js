// backend/api/handlers/map/avRouteMultiPoint.js
const { getAVRouteService } = require('../../../services/business/AVRouteService');

module.exports = async (c) => {
  console.log('🔍 [AV Route API] Multi Point handler called');
  
  try {
    const { points, options = {} } = c.request.body;
    
    if (!points || !Array.isArray(points) || points.length < 2) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'INVALID_POINTS_PARAMETER',
          message: 'At least 2 points are required'
        } 
      };
    }

    const avRouteService = getAVRouteService();
    const route = await avRouteService.getMultiPointRoute(points, options);
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: route 
      } 
    };
  } catch (error) {
    console.error('❌ [AV Route API] Multi Point error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'AV_MULTIPOINT_ROUTE_CALCULATION_FAILED',
        message: error.message 
      } 
    };
  }
};