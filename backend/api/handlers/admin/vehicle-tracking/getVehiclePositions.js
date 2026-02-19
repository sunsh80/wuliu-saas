// backend/api/handlers/admin/vehicle-tracking/getVehiclePositions.js
const VehicleTrackingModel = require('../../../../db/models/VehicleTracking');

module.exports = async (c) => {
  const trackingModel = new VehicleTrackingModel();
  
  try {
    const { vehicle_id, plate_number, tenant_id, status } = c.request.query;
    
    const filters = {};
    if (vehicle_id) filters.vehicle_id = vehicle_id;
    if (plate_number) filters.plate_number = plate_number;
    if (tenant_id) filters.tenant_id = tenant_id;
    if (status) filters.status = status;
    
    const positions = await trackingModel.listAllPositions(filters);
    const stats = await trackingModel.getStats();
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          positions,
          stats
        }
      }
    };
  } catch (error) {
    console.error('获取车辆位置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取车辆位置失败'
      }
    };
  }
};
