// pages/order/order.js
Page({
  data: {
    // 货物类型选项
    cargoTypes: ['家具家电', '装修建材', '办公用品', '快递包裹', '其他'],
    cargoTypeIndex: 0,
    selectedCargoType: '家具家电',
    cargoRemark: '', // 新增：货物备注

    // 车型选项
    vehicleTypes: ['无人车', '有人车'],
    vehicleTypeIndex: 0,
    selectedVehicleType: '无人车',

    // 取货时间
    pickupTime: '',

    // 地址信息
    departureAddress: '',
    destinationAddress: '',

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
  },

  onLoad() {
    // 检查登录状态并初始化数据
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || wx.getStorageSync('token');
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }, 1500);
      return;
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

  // 车型选择
  onVehicleTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      vehicleTypeIndex: index,
      selectedVehicleType: this.data.vehicleTypes[index]
    });
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
      volume = (len * wid * hei).toFixed(2); // 保留两位小数
    }
    this.setData({
      volume: volume
    });
  },

  // 地图选点 - 发货
  selectDepartureLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择发货地点:', res);
        this.setData({
          departureAddress: res.address || res.name
        });
      },
      fail: (err) => {
        console.warn('选择发货地点失败或取消:', err);
      }
    });
  },

  // 地图选点 - 收货
  selectDestinationLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择收货地点:', res);
        this.setData({
          destinationAddress: res.address || res.name
        });
      },
      fail: (err) => {
        console.warn('选择收货地点失败或取消:', err);
      }
    });
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
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const token = wx.getStorageSync('token');
    const storedConnectSid = wx.getStorageSync('connect.sid');// 新增调试日志
  console.log('🔍 提交订单时，本地存储的 connect.sid:', storedConnectSid); // 调试日志
  console.log('🔍 submitOrder - 检查登录状态 - isLoggedIn:', isLoggedIn, 'token:', token, 'connect.sid:', storedConnectSid);
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login',
        });
      }, 1500);
      return;
    }

    const { selectedCargoType, cargoRemark, goodsWeight, length, width, height, volume, departureAddress, departureName, departurePhone, destinationAddress, destinationName, destinationPhone, selectedVehicleType, pickupTime } = this.data;

    // 验证必填项
    if (!selectedCargoType || !goodsWeight || !length || !width || !height || !volume || !departureAddress || !departureName || !departurePhone || !destinationAddress || !destinationName || !destinationPhone || !pickupTime) {
      wx.showToast({
        title: '请填写所有必填信息',
        icon: 'none'
      });
      return;
    }
     console.log('🔍 submitOrder - 即将发送请求,Cookie:', storedConnectSid);
    // 构建要发送的数据对象，映射到后端API期望的字段名
    const orderData = {
      cargo_type: selectedCargoType, // 货物类型
      cargo_remark: cargoRemark, // 货物备注
      weight_kg: parseFloat(goodsWeight), // 重量
      length: parseFloat(length), // 长度
      width: parseFloat(width), // 宽度
      height: parseFloat(height), // 高度
      volume_m3: parseFloat(volume), // 体积
      pickup_address: departureAddress, // 发货地址
      delivery_address: destinationAddress, // 收货地址
      shipper_name: departureName, // 发货人姓名
      shipper_phone: departurePhone, // 发货人电话
      recipient_name: destinationName, // 收货人姓名
      recipient_phone: destinationPhone, // 收货人电话
      vehicle_type: selectedVehicleType, // 车型
      pickup_time: pickupTime, // 取货时间
      estimatedPrice: null // 缺省状态
    };

    console.log('准备提交订单数据:', orderData);

    // 发送网络请求提交订单
    wx.request({
      url: 'http://192.168.2.250:3000/api/customer/orders', // 使用正确的后端API地址
      method: 'POST',
      header: {
      'Content-Type': 'application/json',
      // 手动添加 connect.sid cookie
      'cookie': wx.getStorageSync('connect.sid') // 从本地存储读取
    },
      enableHttp2: true,
      enableQuic: true,
      enableCache: false,
      data: orderData,
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          wx.showToast({
            title: '订单创建成功',
            icon: 'success'
          });
          console.log('订单创建成功:', res.data);
          // 可以选择跳转到订单详情页或返回首页
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
  }
});