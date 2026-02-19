// backend/api/handlers/map/history.js
const { getTrackingService } = require('../../../services/business/TrackingService');

module.exports = async (c) => {
  console.log('🔍 [Tracking API] History handler called');
  
  try {
    const { vehicleId } = c.request.params;
    const { startTime, endTime } = c.request.query;
    
    if (!vehicleId || !startTime || !endTime) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'MISSING_PARAMETERS',
          message: 'Vehicle ID and time range are required'
        } 
      };
    }

    const trackingService = getTrackingService();
    const trajectory = await trackingService.getHistoricalTrajectory(vehicleId, parseInt(startTime), parseInt(endTime));
    
    return { 
      status: 200, 
      body: { 
        success: true,
        data: trajectory
      } 
    };
  } catch (error) {
    console.error('❌ [Tracking API] History error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'HISTORY_FETCH_FAILED',
        message: error.message 
      } 
    };
  }
};