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
    // 不在页面加载时进行严格的认证检查，允许用户进入页面
    // 认证检查将在提交订单时进行
    console.log('=== 订单页面 onLoad 开始 ===');
    console.log('订单页面加载，认证检查将在提交订单时进行');

    // 检查认证信息
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const token = wx.getStorageSync('token');
    const connectSid = wx.getStorageSync('connect.sid');

    console.log('认证信息检查:');
    console.log('- isLoggedIn:', isLoggedIn);
    console.log('- token:', token);
    console.log('- connect.sid:', connectSid);

    console.log('=== 订单页面 onLoad 结束 ===');
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
  submitOrder() {
    console.log('=== submitOrder 函数被调用 ===');
    console.log('=== 调试 Storage ===');
console.log('所有 keys:', wx.getStorageInfoSync().keys);
console.log('connect_sid 的值:', wx.getStorageSync('connect_sid'));
console.log('connect.sid 的值:', wx.getStorageSync('connect.sid'));

    // 验证必填项
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
      pickupTime
    } = this.data;

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

// ✅ 从 Storage 读取 token（login.js 已存储）
  const token = wx.getStorageSync('token');
  
  if (!token) {
    wx.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => wx.redirectTo({ url: '/pages/login/login' }), 1500);
    return;
  }

  // ✅ 使用 Authorization 头（不是 Cookie！）
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ← 关键！
  };

    console.log('准备发送订单请求，认证信息:', headers);

    // 发送网络请求提交订单
    wx.request({
      url: 'http://192.168.2.250:3000/api/customer/orders', // 使用正确的后端API地址
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
          // 可以选择跳转到订单详情页或返回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        } else if (res.statusCode === 401) {
          // 认证失败，跳转到登录页面
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

  // ... (其他函数)
});