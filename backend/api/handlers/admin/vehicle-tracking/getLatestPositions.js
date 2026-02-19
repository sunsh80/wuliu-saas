// backend/api/handlers/admin/vehicle-tracking/getLatestPositions.js
const VehicleTrackingModel = require('../../../../db/models/VehicleTracking');

module.exports = async (c) => {
  const trackingModel = new VehicleTrackingModel();
  
  try {
    const positions = await trackingModel.getLatestPositionsForAllVehicles();
    const stats = await trackingModel.getStats();
    const onlineVehicles = await trackingModel.getOnlineVehicles();
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          positions,
          onlineVehicles,
          stats
        }
      }
    };
  } catch (error) {
    console.error('获取最新车辆位置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取最新车辆位置失败'
      }
    };
  }
};
