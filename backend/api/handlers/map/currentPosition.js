// backend/api/handlers/map/currentPosition.js
const { getTrackingService } = require('../../../services/business/TrackingService');

module.exports = async (c) => {
  console.log('🔍 [Tracking API] Current Position handler called');
  
  try {
    const { vehicleId } = c.request.params;
    
    if (!vehicleId) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_VEHICLE_ID',
          message: 'Vehicle ID is required'
        } 
      };
    }

    const trackingService = getTrackingService();
    const status = await trackingService.getCurrentVehicleStatus(vehicleId);
    
    return { 
      status: 200, 
      body: { 
        success: true,
        data: status
      } 
    };
  } catch (error) {
    console.error('❌ [Tracking API] Current Position error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'CURRENT_POSITION_FETCH_FAILED',
        message: error.message 
      } 
    };
  }
};