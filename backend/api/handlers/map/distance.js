// backend/api/handlers/map/distance.js
const { getMapService } = require('../../../services/business/MapService');

module.exports = async (c) => {
  console.log('🔍 [Map API] Distance handler called');
  
  try {
    const { lat1, lng1, lat2, lng2 } = c.request.query;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_COORDINATES_PARAMETER',
          message: 'Both coordinate pairs are required'
        } 
      };
    }

    const mapService = getMapService();
    const result = await mapService.calculateDistance(
      parseFloat(lat1),
      parseFloat(lng1),
      parseFloat(lat2),
      parseFloat(lng2)
    );
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: { distance: result } 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] Distance error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'DISTANCE_CALCULATION_FAILED',
        message: error.message 
      } 
    };
  }
};