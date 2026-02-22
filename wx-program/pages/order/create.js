// pages/order/create.js
Page({
  data: {
    // 货物类型
    cargoTypes: ['家具家电', '装修建材', '办公用品', '快递包裹', '其他'],
    cargoTypeIndex: 0,
    selectedCargoType: '家具家电',
    cargoRemark: '',

    // 货物尺寸
    goodsWeight: '',
    length: '',
    width: '',
    height: '',
    volume: '',

    // 装货地址
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,

    // 装货联系人
    shipperName: '',
    shipperPhone: '',

    // 系统数据
    approvedStopPoints: [],

    // 语音相关（预留）
    isRecording: false
  },

  onLoad() {
    this.loadApprovedStopPoints();
  },

  // 加载停靠点
  loadApprovedStopPoints() {
    const token = wx.getStorageSync('token');
    wx.request({
      url: 'http://192.168.2.250:3000/api/map/stop-points?limit=100',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data?.success) {
          this.setData({ approvedStopPoints: res.data.data || [] });
        }
      }
    });
  },

  // 货物类型选择
  onCargoTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      cargoTypeIndex: index,
      selectedCargoType: this.data.cargoTypes[index]
    });
  },

  // 尺寸输入 & 计算体积
  onLengthInput(e) { this.setData({ length: e.detail.value }); this.calculateVolume(); },
  onWidthInput(e) { this.setData({ width: e.detail.value }); this.calculateVolume(); },
  onHeightInput(e) { this.setData({ height: e.detail.value }); this.calculateVolume(); },
  onGoodsWeightInput(e) { this.setData({ goodsWeight: e.detail.value }); },
  onCargoRemarkInput(e) { this.setData({ cargoRemark: e.detail.value }); },

  calculateVolume() {
    const { length, width, height } = this.data;
    let volume = '';
    if (length && width && height) {
      const len = parseFloat(length);
      const wid = parseFloat(width);
      const hei = parseFloat(height);
      volume = (len * wid * hei).toFixed(2);
    }
    this.setData({ volume });
  },

  // 装货地址选择
  selectPickupLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          pickupAddress: res.address || res.name,
          pickupLat: res.latitude,
          pickupLng: res.longitude
        });
      },
      fail: (err) => {
        console.warn('选择地点失败:', err);
      }
    });
  },

  // 联系人输入
  onShipperNameInput(e) { this.setData({ shipperName: e.detail.value }); },
  onShipperPhoneInput(e) { this.setData({ shipperPhone: e.detail.value }); },

  // 下一步：保存临时数据，跳转
  onNext() {
    const {
      selectedCargoType, cargoRemark, goodsWeight, length, width, height, volume,
      pickupAddress, pickupLat, pickupLng,
      shipperName, shipperPhone
    } = this.data;

    // 必填校验
    if (!selectedCargoType || !goodsWeight || !length || !width || !height || !volume ||
        !pickupAddress || !shipperName || !shipperPhone) {
      wx.showToast({ title: '请填写所有必填信息', icon: 'none' });
      return;
    }

    // 保存到临时存储
    wx.setStorageSync('ORDER_TEMP', {
      selectedCargoType,
      cargoRemark,
      goodsWeight,
      length,
      width,
      height,
      volume,
      pickupAddress,
      pickupLat,
      pickupLng,
      shipperName,
      shipperPhone,
      deliveryPoints: [] // 初始化空数组
    });

    wx.navigateTo({ url: '/pages/order/confirm' });
  },

  // 语音入口（预留，当前仅提示）
  startVoiceInput() {
    wx.showToast({ title: '语音功能开发中', icon: 'none' });
  }
});