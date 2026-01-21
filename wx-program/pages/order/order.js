// pages/order/order.js
Page({
  data: {
    // ============ 表单字段 ============
    // 🔹 基本信息
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    
    // 🔹 货物信息
    goodsDescription: '',
    goodsType: 'general',
    goodsTypes: [
      'general',      // 普通货物
      'fragile',      // 易碎品
      'refrigerated', // 冷藏品
      'hazardous',    // 危险品
      'oversized',    // 超大件
      'valuable',     // 贵重物品
      'perishable'    // 易腐品
    ],
    
    // 🔹 重量体积
    weightKg: '',
    volumeM3: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    
    // 🔹 地址信息
    pickupLocation: {
      address: '',
      contactName: '',
      contactPhone: '',
      timeWindow: { start: '', end: '' }
    },
    deliveryLocation: {
      address: '',
      contactName: '',
      contactPhone: '',
      timeWindow: { start: '', end: '' }
    },
    
    // 🔹 时效要求
    pickupTimeWindow: {
      earliest: '',
      latest: '',
      flexibleHours: 2
    },
    deliveryTimeWindow: {
      earliest: '',
      latest: '',
      flexibleHours: 2
    },
    requiredDeliveryBy: '',
    
    // 🔹 车辆偏好
    preferredVehicleTypes: [],
    vehicleTypes: [
      'autonomous_van',      // 无人面包车
      'autonomous_truck',    // 无人卡车
      'autonomous_refrigerated', // 无人冷藏车
      'semi_autonomous',     // 半自动驾驶
      'traditional'          // 传统车辆
    ],
    
    // 🔹 备注
    packagingRequirements: '',
    specialHandling: '',
    
    // 🔹 价格敏感度
    priceSensitivity: 'medium', // low/medium/high
    maxPrice: '',
    negotiable: true,
    
    // ============ 状态管理 ============
    requestType: 'immediate', // immediate/scheduled/recurring/bulk/auction
    priorityLevel: 'normal',  // low/normal/high/urgent
    matchingStrategy: 'balanced', // fastest/cheapest/best_rated/balanced
    allowAutoMatch: true,
    
    // ============ UI状态 ============
    currentStep: 1,  // 1: 基本信息, 2: 货物信息, 3: 地址信息, 4: 时效要求, 5: 偏好设置
    isSubmitting: false,
    submitProgress: 0,
    tempOrderId: null,
    trackingNumber: '',
    estimatedPrice: 0
  },

  // ============ 生命周期 ============
  onLoad(options) {
    this.loadFromStorage();
    this.initFormData();
  },

  onShow() {
    // 页面显示时刷新订单状态
    this.checkOrderStatus();
  },

  // ============ 初始化方法 ============
  initFormData() {
    // 设置默认值
    const now = new Date();
    const today = this.formatDate(now);
    const tomorrow = this.formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    
    this.setData({
      'pickupTimeWindow.earliest': today + 'T09:00',
      'pickupTimeWindow.latest': today + 'T18:00',
      'deliveryTimeWindow.earliest': tomorrow + 'T09:00',
      'deliveryTimeWindow.latest': tomorrow + 'T18:00',
      requiredDeliveryBy: tomorrow + 'T18:00'
    });
  },

  loadFromStorage() {
    const savedId = wx.getStorageSync('tempOrderId');
    const savedTracking = wx.getStorageSync('trackingNumber');
    
    if (savedId) {
      this.setData({ tempOrderId: savedId });
      this.checkOrderStatus(savedId);
    }
    
    if (savedTracking) {
      this.setData({ trackingNumber: savedTracking });
    }
  },

  // ============ 步骤导航 ============
  nextStep() {
    if (this.data.currentStep < 5) {
      if (this.validateCurrentStep()) {
        this.setData({ currentStep: this.data.currentStep + 1 });
        this.scrollToTop();
      }
    }
  },

  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({ currentStep: this.data.currentStep - 1 });
      this.scrollToTop();
    }
  },

  goToStep(e) {
    const step = e.currentTarget.dataset.step;
    if (step < this.data.currentStep) {
      this.setData({ currentStep: step });
      this.scrollToTop();
    }
  },

  validateCurrentStep() {
    const { currentStep } = this.data;
    
    switch (currentStep) {
      case 1: // 基本信息
        if (!this.data.customerPhone?.trim()) {
          wx.showToast({ title: '请填写联系电话', icon: 'none' });
          return false;
        }
        return true;
        
      case 2: // 货物信息
        if (!this.data.weightKg || isNaN(this.data.weightKg) || parseFloat(this.data.weightKg) <= 0) {
          wx.showToast({ title: '请输入有效重量 (kg)', icon: 'none' });
          return false;
        }
        return true;
        
      case 3: // 地址信息
        if (!this.data.pickupLocation.address?.trim()) {
          wx.showToast({ title: '请填写取件地址', icon: 'none' });
          return false;
        }
        if (!this.data.deliveryLocation.address?.trim()) {
          wx.showToast({ title: '请填写收货地址', icon: 'none' });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  },

  // ============ 输入处理 ============
  onInput(e) {
    const { field, subfield } = e.currentTarget.dataset;
    let value = e.detail.value;
    
    // 特殊字段处理
    if (field === 'weightKg' || field === 'volumeM3') {
      value = this.parseNumber(value);
    }
    
    if (subfield) {
      // 处理嵌套对象，如 dimensions.length
      const path = `${field}.${subfield}`;
      this.setData({ [path]: value });
    } else {
      this.setData({ [field]: value });
    }
    
    // 实时计算预估价格
    if (field === 'weightKg' || field === 'volumeM3') {
      this.calculateEstimatedPrice();
    }
  },

  onPickerChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({ [field]: value });
  },

  onTimePickerChange(e) {
    const { field, subfield } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    if (subfield) {
      const path = `${field}.${subfield}`;
      this.setData({ [path]: value });
    } else {
      this.setData({ [field]: value });
    }
  },

  onVehicleTypeSelect(e) {
    const selected = e.detail.value;
    this.setData({ preferredVehicleTypes: selected });
  },

  // ============ 地址相关 ============
  choosePickupLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'pickupLocation.address': res.address || res.name,
          'pickupLocation.latitude': res.latitude,
          'pickupLocation.longitude': res.longitude
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
      }
    });
  },

  chooseDeliveryLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'deliveryLocation.address': res.address || res.name,
          'deliveryLocation.latitude': res.latitude,
          'deliveryLocation.longitude': res.longitude
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
      }
    });
  },

  // ============ 价格计算 ============
  calculateEstimatedPrice() {
    const weight = parseFloat(this.data.weightKg) || 0;
    const volume = parseFloat(this.data.volumeM3) || 0;
    
    // 简化价格计算：距离使用固定值，实际应该计算两点距离
    const basePrice = 5.0; // 起步价
    const perKmRate = 2.0; // 每公里费率
    const perKgRate = 0.5; // 每公斤费率
    const perM3Rate = 3.0; // 每立方米费率
    
    // 假设距离为10公里（实际应该计算）
    const distance = 10;
    
    let estimatedPrice = basePrice + 
                        (distance * perKmRate) + 
                        (weight * perKgRate) + 
                        (volume * perM3Rate);
    
    // 根据优先级调整
    if (this.data.priorityLevel === 'urgent') {
      estimatedPrice *= 1.3;
    } else if (this.data.priorityLevel === 'high') {
      estimatedPrice *= 1.2;
    }
    
    this.setData({ estimatedPrice: Math.round(estimatedPrice * 100) / 100 });
  },

  // ============ 订单提交 ============
  async submitOrder() {
    // 🔒 防重复提交
    if (this.data.isSubmitting) {
      wx.showToast({ title: '正在提交，请稍候', icon: 'none' });
      return;
    }

    // 最终验证
    if (!this.validateCurrentStep()) {
      return;
    }

    // 设置提交状态
    this.setData({ 
      isSubmitting: true,
      submitProgress: 10 
    });

    try {
      wx.showLoading({ title: '正在创建订单...', mask: true });
      
      // 构建完整的请求数据（匹配后端order_requests表结构）
      const requestData = this.buildRequestData();
      
      // 发送请求
      const res = await this.sendOrderRequest(requestData);
      
      // 处理响应
      await this.handleOrderResponse(res);
      
    } catch (error) {
      console.error('订单提交失败:', error);
      this.handleOrderError(error);
    } finally {
      wx.hideLoading();
      this.setData({ 
        isSubmitting: false,
        submitProgress: 0 
      });
    }
  },

  buildRequestData() {
    const now = new Date().toISOString();
    const deliveryTime = new Date(this.data.requiredDeliveryBy || new Date(Date.now() + 24 * 60 * 60 * 1000));
    
    return {
      // 需求基本信息
      request_type: this.data.requestType,
      priority_level: this.data.priorityLevel,
      
      // 货物信息
      goods_description: this.data.goodsDescription,
      goods_type: this.data.goodsType,
      weight_kg: parseFloat(this.data.weightKg) || 0,
      volume_m3: parseFloat(this.data.volumeM3) || undefined,
      dimensions: this.data.dimensions,
      packaging_requirements: this.data.packagingRequirements,
      special_handling: this.data.specialHandling,
      
      // 起止地址（JSON格式）
      pickup_location: {
        address: this.data.pickupLocation.address,
        latitude: this.data.pickupLocation.latitude,
        longitude: this.data.pickupLocation.longitude,
        contact_name: this.data.customerName,
        contact_phone: this.data.customerPhone,
        time_window: this.data.pickupTimeWindow
      },
      
      delivery_location: {
        address: this.data.deliveryLocation.address,
        latitude: this.data.deliveryLocation.latitude,
        longitude: this.data.deliveryLocation.longitude,
        contact_name: this.data.customerName,
        contact_phone: this.data.customerPhone,
        time_window: this.data.deliveryTimeWindow
      },
      
      // 时效要求
      pickup_time_window: this.data.pickupTimeWindow,
      delivery_time_window: this.data.deliveryTimeWindow,
      required_delivery_by: deliveryTime.toISOString(),
      
      // 车辆偏好
      preferred_vehicle_types: this.data.preferredVehicleTypes,
      vehicle_requirements: {
        autonomy_level_min: this.data.preferredVehicleTypes.includes('autonomous_van') ? 1 : 0
      },
      
      // 预算与定价
      budget_constraints: {
        max_price: parseFloat(this.data.maxPrice) || undefined,
        preferred_pricing_model: 'distance_weight_based',
        price_sensitivity: this.data.priceSensitivity,
        negotiable: this.data.negotiable
      },
      
      // 匹配偏好
      matching_preferences: {
        min_carrier_rating: 3.0,
        max_response_time_minutes: 30,
        allow_auto_match: this.data.allowAutoMatch,
        matching_strategy: this.data.matchingStrategy
      },
      
      // 客户端信息
      customer_info: {
        name: this.data.customerName,
        phone: this.data.customerPhone,
        email: this.data.customerEmail
      },
      
      // 状态
      status: 'draft',
      visibility_scope: 'public'
    };
  },

  async sendOrderRequest(requestData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/api/order-requests',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestData,
        timeout: 15000,
        success: (res) => {
          this.setData({ submitProgress: 80 });
          resolve(res);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  async handleOrderResponse(res) {
    this.setData({ submitProgress: 90 });
    
    if (res.statusCode === 201) {
      const { request_id, request_code, tracking_code } = res.data || {};
      
      if (request_id) {
        // 保存订单信息
        wx.setStorageSync('tempOrderId', request_id);
        wx.setStorageSync('trackingNumber', tracking_code || '');
        
        this.setData({ 
          tempOrderId: request_id,
          trackingNumber: tracking_code || '',
          submitProgress: 100
        });
        
        // 显示成功消息
        wx.showToast({ 
          title: '订单创建成功', 
          icon: 'success', 
          duration: 2000 
        });
        
        // 等待2秒后跳转
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order-detail/order-detail?id=${request_id}`
          });
        }, 2000);
      } else {
        throw new Error('成功但未返回订单ID');
      }
    } else {
      const errMsg = res.data?.error || 
                    res.data?.message || 
                    `请求失败 (${res.statusCode})`;
      throw new Error(errMsg);
    }
  },

  handleOrderError(error) {
    let errorMessage = '订单提交失败';
    
    if (error.message.includes('网络')) {
      errorMessage = '网络错误，请检查连接后重试';
    } else if (error.message.includes('401')) {
      errorMessage = '请先登录';
    } else if (error.message.includes('400')) {
      errorMessage = '请检查输入信息是否正确';
    } else if (error.message.includes('500')) {
      errorMessage = '服务器繁忙，请稍后重试';
    }
    
    wx.showToast({ 
      title: errorMessage, 
      icon: 'none', 
      duration: 3000 
    });
  },

  // ============ 订单状态检查 ============
  async checkOrderStatus(orderId = null) {
    const id = orderId || this.data.tempOrderId;
    if (!id) return;
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://localhost:3000/api/order-requests/${id}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      if (res.statusCode === 200) {
        const order = res.data;
        this.updateOrderStatus(order);
      }
    } catch (error) {
      console.error('检查订单状态失败:', error);
    }
  },

  updateOrderStatus(order) {
    // 根据订单状态更新UI
    const statusMap = {
      'draft': '草稿',
      'published': '已发布',
      'matching': '匹配中',
      'quoting': '报价中',
      'accepted': '已接受',
      'expired': '已过期',
      'cancelled': '已取消'
    };
    
    if (order.status) {
      wx.showToast({ 
        title: `订单状态: ${statusMap[order.status] || order.status}`, 
        icon: 'none' 
      });
    }
  },

  // ============ 工具函数 ============
  parseNumber(value) {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toString();
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  // ============ 清除表单 ============
  clearForm() {
    const defaultData = {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      goodsDescription: '',
      goodsType: 'general',
      weightKg: '',
      volumeM3: '',
      dimensions: { length: '', width: '', height: '' },
      pickupLocation: { address: '', contactName: '', contactPhone: '' },
      deliveryLocation: { address: '', contactName: '', contactPhone: '' },
      pickupTimeWindow: { earliest: '', latest: '', flexibleHours: 2 },
      deliveryTimeWindow: { earliest: '', latest: '', flexibleHours: 2 },
      requiredDeliveryBy: '',
      preferredVehicleTypes: [],
      packagingRequirements: '',
      specialHandling: '',
      priceSensitivity: 'medium',
      maxPrice: '',
      negotiable: true,
      requestType: 'immediate',
      priorityLevel: 'normal',
      matchingStrategy: 'balanced',
      allowAutoMatch: true
    };
    
    this.setData(defaultData);
    this.initFormData();
    
    wx.removeStorageSync('tempOrderId');
    wx.removeStorageSync('trackingNumber');
  },

  // ============ 复制跟踪号 ============
  copyTrackingNumber() {
    if (this.data.trackingNumber) {
      wx.setClipboardData({
        data: this.data.trackingNumber,
        success: () => {
          wx.showToast({ title: '已复制跟踪号', icon: 'success' });
        }
      });
    }
  }
});