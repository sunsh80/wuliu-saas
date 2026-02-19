// 地图服务API模拟数据

// 模拟停靠点数据
const stopPoints = [
  {
    id: 1,
    name: "沈阳站配送点",
    address: "辽宁省沈阳市和平区胜利北街",
    lat: 41.7923,
    lng: 123.4234,
    type: "commercial",
    region: "沈阳市和平区",
    status: "active",
    capacity: 10,
    description: "主要配送点，靠近火车站"
  },
  {
    id: 2,
    name: "桃仙机场配送点",
    address: "辽宁省沈阳市浑南区机场路",
    lat: 41.7856,
    lng: 123.4321,
    type: "commercial",
    region: "沈阳市浑南区",
    status: "active",
    capacity: 15,
    description: "机场周边配送点"
  },
  {
    id: 3,
    name: "中街配送点",
    address: "辽宁省沈阳市沈河区中街路",
    lat: 41.7987,
    lng: 123.4123,
    type: "commercial",
    region: "沈阳市沈河区",
    status: "maintenance",
    capacity: 20,
    description: "商业中心配送点"
  }
];

// 模拟车辆数据
const vehicles = [
  {
    id: 1,
    plate_number: "辽A12345",
    type: "厢式货车",
    length: 6.2,
    width: 2.4,
    height: 2.5,
    max_weight: 5000,
    volume: 30,
    status: "in_transit",
    driver_name: "张师傅",
    driver_phone: "13800138000",
    image_url: "",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-15T08:00:00Z",
    vehicle_model_id: 1
  },
  {
    id: 2,
    plate_number: "辽A23456",
    type: "冷藏车",
    length: 7.2,
    width: 2.4,
    height: 2.8,
    max_weight: 8000,
    volume: 40,
    status: "idle",
    driver_name: "李师傅",
    driver_phone: "13900139000",
    image_url: "",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-02-15T08:00:00Z",
    vehicle_model_id: 2
  }
];

// 模拟API响应函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取停靠点列表
async function getStopPoints(req, res) {
  await delay(500); // 模拟网络延迟
  return {
    success: true,
    data: stopPoints
  };
}

// 添加停靠点
async function addStopPoint(req, res) {
  await delay(800); // 模拟网络延迟
  const newStopPoint = {
    id: stopPoints.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  stopPoints.push(newStopPoint);
  return {
    success: true,
    data: newStopPoint,
    message: "停靠点添加成功"
  };
}

// 删除停靠点
async function deleteStopPoint(req, res) {
  await delay(600); // 模拟网络延迟
  const id = parseInt(req.params.id);
  const index = stopPoints.findIndex(sp => sp.id === id);
  if (index !== -1) {
    stopPoints.splice(index, 1);
    return {
      success: true,
      message: "停靠点删除成功"
    };
  } else {
    return {
      success: false,
      error: "停靠点不存在"
    };
  }
}

// 获取车辆列表
async function getVehicles(req, res) {
  await delay(500); // 模拟网络延迟
  return {
    success: true,
    data: {
      vehicles: vehicles,
      pagination: {
        current_page: 1,
        per_page: 10,
        total: vehicles.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
      }
    }
  };
}

// 获取车辆位置
async function getVehicleLocation(req, res) {
  await delay(300); // 模拟网络延迟
  const vehicleId = req.params.vehicleId;
  const vehicle = vehicles.find(v => v.id == vehicleId);
  
  if (vehicle) {
    // 模拟实时位置数据
    const mockLocations = [
      { lat: 41.7923, lng: 123.4234, timestamp: Date.now() - 300000 },
      { lat: 41.7930, lng: 123.4240, timestamp: Date.now() - 240000 },
      { lat: 41.7945, lng: 123.4250, timestamp: Date.now() - 180000 },
      { lat: 41.7960, lng: 123.4260, timestamp: Date.now() - 120000 },
      { lat: 41.7975, lng: 123.4270, timestamp: Date.now() - 60000 },
      { lat: 41.7980, lng: 123.4275, timestamp: Date.now() }
    ];
    
    return {
      success: true,
      data: {
        vehicleId: vehicleId,
        online: true,
        lastPosition: mockLocations[mockLocations.length - 1],
        battery: 85,
        speed: 45,
        heading: 90,
        status: vehicle.status
      }
    };
  } else {
    return {
      success: false,
      error: "车辆不存在"
    };
  }
}

// 获取路线规划
async function getRoute(req, res) {
  await delay(1000); // 模拟网络延迟
  const { startLat, startLng, endLat, endLng } = req.query;
  
  // 模拟路线数据
  const mockRoute = {
    distance: 15000, // 米
    duration: 1800, // 秒
    polyline: "mock_polyline_data_here",
    steps: [
      { instruction: "沿北京街向北行驶", distance: 2000, duration: 300 },
      { instruction: "右转进入青年大街", distance: 3000, duration: 450 },
      { instruction: "直行至目的地", distance: 10000, duration: 1050 }
    ]
  };
  
  return {
    success: true,
    data: mockRoute
  };
}

// 导出API函数
export {
  getStopPoints,
  addStopPoint,
  deleteStopPoint,
  getVehicles,
  getVehicleLocation,
  getRoute
};