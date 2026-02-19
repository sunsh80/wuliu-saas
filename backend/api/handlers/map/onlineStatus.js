// backend/api/handlers/map/onlineStatus.js
const { getTrackingService } = require('../../../services/business/TrackingService');

module.exports = async (c) => {
  console.log('🔍 [Tracking API] Online Status handler called');
  
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
    const online = await trackingService.getOnlineStatus(vehicleId);
    
    return { 
      status: 200, 
      body: { 
        success: true,
        data: { online }
      } 
    };
  } catch (error) {
    console.error('❌ [Tracking API] Online Status error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'ONLINE_STATUS_FETCH_FAILED',
        message: error.message 
      } 
    };
  }
};