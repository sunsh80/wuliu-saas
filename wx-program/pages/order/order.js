// pages/order/order.js
Page({
  data: {
    // 货物类型选项
    cargoTypes: ['家具家电', '装修建材', '办公用品', '快递包裹', '其他'],
    cargoTypeIndex: 0,
    selectedCargoType: '家具家电',
    cargoRemark: '', // 货物备注

    // 车型选项（提前到货物体积旁边）
    vehicleTypes: ['无人车', '有人车', '混合车型'],
    vehicleTypeIndex: 0,
    selectedVehicleType: '无人车',

    // 取货时间
    pickupTime: '',

    // 地址信息
    departureAddress: '',
    destinationAddress: '',
    
    // 坐标信息（新增）
    departureLat: null,
    departureLng: null,
    destinationLat: null,
    destinationLng: null,

    // 人员信息
    departureName: '',
    departurePhone: '',
    destinationName: '',
    destinationPhone: '',

    // 货物信息
    goodsWeight: '',
    length: '', // 长度
    width: '', // 宽度
    height: '', // 高度
    volume: '', // 计算出的体积，初始为空

    // 其他
    remark: '',
    
    // 新增：已审批停靠点列表
    approvedStopPoints: [],
    
    // 新增：地址选择模式提示
    addressSelectionMode: '', // 'restricted' 限制模式 | 'free' 自由模式
  },

  onLoad() {
    console.log('=== 订单页面 onLoad 开始 ===');
    // 加载已审批停靠点
    this.loadApprovedStopPoints();
    console.log('=== 订单页面 onLoad 结束 ===');
  },

  // 加载已审批停靠点
  async loadApprovedStopPoints() {
    try {
      const token = wx.getStorageSync('token');
      const res = await wx.request({
        url: 'http://192.168.2.250:3000/api/map/stop-points?approval_status=approved&limit=100',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.statusCode === 200 && res.data.success) {
        this.setData({
          approvedStopPoints: res.data.data || []
        });
        console.log('已加载停靠点数量:', this.data.approvedStopPoints.length);
      }
    } catch (err) {
      console.error('加载停靠点失败:', err);
    }
  },

  // 货物类型选择
  onCargoTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      cargoTypeIndex: index,
      selectedCargoType: this.data.cargoTypes[index]
    });
  },

  // 车型选择（核心逻辑）
  onVehicleTypeChange(e) {
    const index = e.detail.value;
    const vehicleType = this.data.vehicleTypes[index];
    
    this.setData({
      vehicleTypeIndex: index,
      selectedVehicleType: vehicleType
    });

    // 根据车型设置地址选择模式
    let modeText = '';
    if (vehicleType === '无人车') {
      modeText = '🔒 仅能从已审批停靠点选择';
    } else if (vehicleType === '有人车') {
      modeText = '📍 可自由选择任意地址';
    } else {
      modeText = '🚛 优先推荐停靠点，可自由选择（500m 范围内）';
    }
    
    this.setData({
      addressSelectionMode: modeText
    });

    // 如果已填写地址，检查是否符合新车型要求
    if (vehicleType === '无人车') {
      this.checkIfAddressIsStopPoint('departure');
      this.checkIfAddressIsStopPoint('destination');
    }
  },

  // 检查地址是否为停靠点
  checkIfAddressIsStopPoint(type) {
    const lat = type === 'departure' ? this.data.departureLat : this.data.destinationLat;
    const lng = type === 'departure' ? this.data.departureLng : this.data.destinationLng;
    
    if (!lat || !lng) return;

    const isStopPoint = this.data.approvedStopPoints.some(point => {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      return distance <= 500; // 500 米范围内
    });

    if (!isStopPoint && this.data.selectedVehicleType === '无人车') {
      wx.showModal({
        title: '地址不符合要求',
        content: '无人车配送仅能从已审批停靠点选择，请重新选择地址或切换车型',
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          // 清空地址
          this.setData({
            [`${type}Address`]: '',
            [`${type}Lat`]: null,
            [`${type}Lng`]: null
          });
        }
      });
    }
  },

  // 计算两点间距离（Haversine 公式）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(degrees) {
    return degrees * Math.PI / 180;
  },

  // 取货时间选择
  onPickupTimeChange(e) {
    this.setData({
      pickupTime: e.detail.value
    });
  },

  // 货物备注输入
  onCargoRemarkInput(e) {
    this.setData({
      cargoRemark: e.detail.value
    });
  },

  // 货物重量输入
  onGoodsWeightInput(e) {
    this.setData({
      goodsWeight: e.detail.value
    });
  },

  // 长宽高输入
  onLengthInput(e) {
    this.setData({
      length: e.detail.value
    });
    this.calculateVolume();
  },

  onWidthInput(e) {
    this.setData({
      width: e.detail.value
    });
    this.calculateVolume();
  },

  onHeightInput(e) {
    this.setData({
      height: e.detail.value
    });
    this.calculateVolume();
  },

  // 计算体积
  calculateVolume() {
    const { length, width, height } = this.data;
    let volume = '';
    if (length && width && height) {
      const len = parseFloat(length);
      const wid = parseFloat(width);
      const hei = parseFloat(height);
      volume = (len * wid * hei).toFixed(2);
    }
    this.setData({
      volume: volume
    });
  },

  // 地图选点 - 发货
  selectDepartureLocation() {
    const vehicleType = this.data.selectedVehicleType;
    
    if (vehicleType === '无人车') {
      // 无人车：仅能从停靠点列表选择
      this.showStopPointSelector('departure');
    } else if (vehicleType === '有人车') {
      // 有人车：自由选择
      this.openMapSelector('departure');
    } else {
      // 混合车型：显示选择对话框
      wx.showActionSheet({
        itemList: ['从停靠点列表选择', '地图自由选点'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.showStopPointSelector('departure');
          } else {
            this.openMapSelector('departure');
          }
        }
      });
    }
  },

  // 地图选点 - 收货
  selectDestinationLocation() {
    const vehicleType = this.data.selectedVehicleType;
    
    if (vehicleType === '无人车') {
      this.showStopPointSelector('destination');
    } else if (vehicleType === '有人车') {
      this.openMapSelector('destination');
    } else {
      wx.showActionSheet({
        itemList: ['从停靠点列表选择', '地图自由选点'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.showStopPointSelector('destination');
          } else {
            this.openMapSelector('destination');
          }
        }
      });
    }
  },

  // 显示停靠点选择器
  showStopPointSelector(type) {
    const stopPoints = this.data.approvedStopPoints;
    
    if (stopPoints.length === 0) {
      wx.showToast({
        title: '暂无可用停靠点',
        icon: 'none'
      });
      return;
    }

    const itemList = stopPoints.map(point => point.name || point.address);
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const selectedPoint = stopPoints[res.tapIndex];
        this.setData({
          [`${type}Address`]: selectedPoint.address,
          [`${type}Lat`]: selectedPoint.lat,
          [`${type}Lng`]: selectedPoint.lng
        });
        
        console.log(`选择${type}停靠点:`, selectedPoint);
      }
    });
  },

  // 打开地图选点器
  openMapSelector(type) {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择地点:', res);
        const address = res.address || res.name;
        
        // 如果是混合车型，检查是否在停靠点 500m 范围内
        if (this.data.selectedVehicleType === '混合车型') {
          this.checkAndRecommendStopPoint(type, res.latitude, res.longitude, address);
        } else {
          this.setData({
            [`${type}Address`]: address,
            [`${type}Lat`]: res.latitude,
            [`${type}Lng`]: res.longitude
          });
        }
      },
      fail: (err) => {
        console.warn('选择地点失败或取消:', err);
      }
    });
  },

  // 混合车型：检查并推荐停靠点
  checkAndRecommendStopPoint(type, lat, lng, address) {
    // 查找 500m 范围内的停靠点
    const nearbyStopPoints = this.data.approvedStopPoints.filter(point => {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      return distance <= 500;
    });

    if (nearbyStopPoints.length > 0) {
      // 按距离排序
      nearbyStopPoints.sort((a, b) => {
        const distA = this.calculateDistance(lat, lng, a.lat, a.lng);
        const distB = this.calculateDistance(lat, lng, b.lat, b.lng);
        return distA - distB;
      });

      const nearestPoint = nearbyStopPoints[0];
      const distance = this.calculateDistance(lat, lng, nearestPoint.lat, nearestPoint.lng).toFixed(0);

      wx.showModal({
        title: '推荐停靠点',
        content: `附近 ${distance}m 处有推荐停靠点：${nearestPoint.name || nearestPoint.address}\n\n选择该停靠点可能享受更快配送和优惠价格，是否选择？`,
        confirmText: '选择推荐',
        cancelText: '坚持自选',
        success: (modalRes) => {
          if (modalRes.confirm) {
            // 选择推荐停靠点
            this.setData({
              [`${type}Address`]: nearestPoint.address,
              [`${type}Lat`]: nearestPoint.lat,
              [`${type}Lng`]: nearestPoint.lng
            });
            wx.showToast({
              title: '已选择推荐停靠点',
              icon: 'success'
            });
          } else {
            // 坚持自选地址
            this.setData({
              [`${type}Address`]: address,
              [`${type}Lat`]: lat,
              [`${type}Lng`]: lng
            });
          }
        }
      });
    } else {
      // 500m 范围内无停靠点，直接使用自选地址
      this.setData({
        [`${type}Address`]: address,
        [`${type}Lat`]: lat,
        [`${type}Lng`]: lng
      });
    }
  },

  // 地址输入框事件
  onDepartureAddressInput(e) {
    this.setData({
      departureAddress: e.detail.value
    });
  },

  onDestinationAddressInput(e) {
    this.setData({
      destinationAddress: e.detail.value
    });
  },

  // 人员信息输入框事件
  onDepartureNameInput(e) {
    this.setData({
      departureName: e.detail.value
    });
  },

  onDeparturePhoneInput(e) {
    this.setData({
      departurePhone: e.detail.value
    });
  },

  onDestinationNameInput(e) {
    this.setData({
      destinationName: e.detail.value
    });
  },

  onDestinationPhoneInput(e) {
    this.setData({
      destinationPhone: e.detail.value
    });
  },

  // 提交订单
  submitOrder() {
    console.log('=== submitOrder 函数被调用 ===');

    const {
      selectedCargoType,
      cargoRemark,
      goodsWeight,
      length,
      width,
      height,
      volume,
      departureAddress,
      departureName,
      departurePhone,
      destinationAddress,
      destinationName,
      destinationPhone,
      selectedVehicleType,
      pickupTime,
      departureLat,
      departureLng,
      destinationLat,
      destinationLng
    } = this.data;

    // 验证必填项
    if (
      !selectedCargoType ||
      !goodsWeight ||
      !length ||
      !width ||
      !height ||
      !volume ||
      !departureAddress ||
      !departureName ||
      !departurePhone ||
      !destinationAddress ||
      !destinationName ||
      !destinationPhone ||
      !pickupTime
    ) {
      wx.showToast({
        title: '请填写所有必填信息',
        icon: 'none'
      });
      return;
    }

    // 无人车/混合车型：验证地址是否为停靠点
    if (selectedVehicleType === '无人车' || selectedVehicleType === '混合车型') {
      if (!departureLat || !departureLng || !destinationLat || !destinationLng) {
        wx.showToast({
          title: '请从停靠点列表选择地址',
          icon: 'none'
        });
        return;
      }

      // 验证是否在停靠点 500m 范围内
      const isDepartureValid = this.isWithinStopPointRange(departureLat, departureLng);
      const isDestinationValid = this.isWithinStopPointRange(destinationLat, destinationLng);

      if (!isDepartureValid || !isDestinationValid) {
        wx.showModal({
          title: '地址验证失败',
          content: '无人车/混合车型配送需要选择停靠点或停靠点 500m 范围内的地址，请重新选择',
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }
    }

    // 构建订单数据
    const orderData = {
      cargo_type: selectedCargoType,
      cargo_remark: cargoRemark,
      weight_kg: parseFloat(goodsWeight),
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      volume_m3: parseFloat(volume),
      pickup_address: departureAddress,
      delivery_address: destinationAddress,
      shipper_name: departureName,
      shipper_phone: departurePhone,
      recipient_name: destinationName,
      recipient_phone: destinationPhone,
      vehicle_type: selectedVehicleType,
      pickup_time: pickupTime,
      estimatedPrice: null,
      // 新增：坐标信息
      pickup_lat: departureLat,
      pickup_lng: departureLng,
      delivery_lat: destinationLat,
      delivery_lng: destinationLng
    };

    console.log('准备提交订单数据:', orderData);

    // 获取 token
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => wx.redirectTo({ url: '/pages/login/login' }), 1500);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('准备发送订单请求，认证信息:', headers);

    // 发送网络请求
    wx.request({
      url: 'http://192.168.2.250:3000/api/customer/orders',
      method: 'POST',
      header: headers,
      data: orderData,
      success: (res) => {
        console.log('订单请求响应:', res);
        if (res.statusCode === 201 || res.statusCode === 200) {
          wx.showToast({
            title: '订单创建成功',
            icon: 'success'
          });
          console.log('订单创建成功:', res.data);
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        } else if (res.statusCode === 401) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login',
            });
          }, 1500);
        } else {
          console.error('订单创建失败:', res);
          wx.showToast({
            title: '创建失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交订单请求失败:', err);
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        });
      }
    });

    console.log('=== submitOrder 函数执行完毕 ===');
  },

  // 验证地址是否在停靠点 500m 范围内
  isWithinStopPointRange(lat, lng) {
    return this.data.approvedStopPoints.some(point => {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      return distance <= 500;
    });
  }
});
