// backend/api/handlers/map/positionUpdate.js
const { getTrackingService } = require('../../../services/business/TrackingService');

module.exports = async (c) => {
  console.log('🔍 [Tracking API] Position Update handler called');
  
  try {
    const { vehicleId, lat, lng, timestamp, additionalData } = c.request.body;
    
    if (!vehicleId || lat == null || lng == null) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_VEHICLE_INFO',
          message: 'Vehicle ID and coordinates are required'
        } 
      };
    }

    const trackingService = getTrackingService();
    await trackingService.receiveLocationUpdate(
      vehicleId,
      parseFloat(lat),
      parseFloat(lng),
      timestamp || Date.now(),
      additionalData || {}
    );
    
    return { 
      status: 200, 
      body: { 
        success: true,
        message: 'Position updated successfully'
      } 
    };
  } catch (error) {
    console.error('❌ [Tracking API] Position Update error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'POSITION_UPDATE_FAILED',
        message: error.message 
      } 
    };
  }
};