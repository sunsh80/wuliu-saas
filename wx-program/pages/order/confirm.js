// pages/order/confirm.js
Page({
  data: {
    orderTemp: null, // 从 Page 1 获取的临时数据
    deliveryPoints: [], // 卸货点列表
    recommendedVehicleType: '无人车', // 默认推荐车型
    totalPrice: 0, // 预估总价
    totalDuration: '30分钟', // 预估总时长
    isAllInStopPoint: true, // 是否全部卸货点都在停靠点范围内
    showVoiceInput: false // 显示语音输入界面approvedStopPoints: []
  },

  onLoad() {
    const orderTemp = wx.getStorageSync('ORDER_TEMP');
    if (!orderTemp) {
      wx.navigateBack();
      return;
    }

    this.setData({ orderTemp });
    this.loadInitialDeliveryPoints();
  },

  loadInitialDeliveryPoints() {
    const initialPoints = [];
    // 这里可以根据业务需求初始化默认卸货点（例如从历史订单中获取）
    this.setData({ deliveryPoints: initialPoints });
  },

  addDeliveryPoint() {
    wx.navigateTo({ url: '/pages/order/delivery-point-editor' });
  },

  editDeliveryPoint(index) {
    const point = this.data.deliveryPoints[index];
    wx.navigateTo({
      url: `/pages/order/delivery-point-editor?index=${index}&point=${JSON.stringify(point)}`
    });
  },

  deleteDeliveryPoint(index) {
    const newPoints = [...this.data.deliveryPoints];
    newPoints.splice(index, 1);
    this.setData({ deliveryPoints: newPoints });
  },

  calculateRecommendations() {
    const { pickupLat, pickupLng, deliveryPoints } = this.data.orderTemp;

    let allInStopPoint = true;
    let totalPrice = 0; // 示例值，实际应调用API计算
    let totalDuration = '30分钟'; // 示例值，实际应调用API计算

    // 校验每个卸货点是否在停靠点范围内
    for (const point of deliveryPoints) {
      if (!this.isWithinStopPointRange(point.lat, point.lng)) {
        allInStopPoint = false;
        break;
      }
    }

    if (allInStopPoint) {
      this.setData({ recommendedVehicleType: '无人车', totalPrice, totalDuration });
    } else {
      this.setData({ recommendedVehicleType: '有人车', totalPrice, totalDuration });
    }
  },

  isWithinStopPointRange(lat, lng) {
    // 假设已加载了停靠点数据 approvedStopPoints
    const approvedStopPoints = this.data.approvedStopPoints || [];
    for (const stop of approvedStopPoints) {
      const distance = this.calculateDistance(stop.lat, stop.lng, lat, lng);
      if (distance <= 500) return true;
    }
    return false;
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine公式计算两点之间的距离
    const R = 6371e3; // 地球半径，单位为米
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in meters
  },

  submitOrder() {
    const { orderTemp, deliveryPoints } = this.data;

    // 合并所有数据并发送请求
    const requestData = {
      ...orderTemp,
      delivery_points: deliveryPoints,
      vehicle_type: this.data.recommendedVehicleType
    };

    wx.request({
      url: 'http://192.168.2.250:3000/api/customer/orders',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'content-type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        if (res.statusCode === 200 && res.data?.success) {
          wx.showToast({ title: '订单创建成功', icon: 'success' });
          wx.switchTab({ url: '/pages/home/index' });
        } else {
          wx.showToast({ title: '订单创建失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
});