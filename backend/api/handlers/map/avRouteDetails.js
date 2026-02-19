// backend/api/handlers/map/avRouteDetails.js
const { getAVRouteService } = require('../../../services/business/AVRouteService');

module.exports = async (c) => {
  console.log('🔍 [AV Route API] Details handler called');
  
  try {
    const { routeId } = c.request.params;
    
    if (!routeId) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_ROUTE_ID_PARAMETER',
          message: 'Route ID is required'
        } 
      };
    }

    const avRouteService = getAVRouteService();
    const details = await avRouteService.getRouteDetails(routeId);
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: details 
      } 
    };
  } catch (error) {
    console.error('❌ [AV Route API] Details error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'AV_ROUTE_DETAILS_FETCH_FAILED',
        message: error.message 
      } 
    };
  }
};