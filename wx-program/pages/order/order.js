// pages/order/order.js
Page({
  data: {
    // 表单字段
    customerName: '',
    customerPhone: '',
    weight: '',
    volume: '',
    origin: '',
    destinationFirst: '',
    destinationSecond: '',
    remark: '',
    
    // 状态管理
    tempOrderId: null,
    isSubmitting: false // 🔒 防重复提交标志
  },

  // 输入监听器（通用）
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  // 提交订单
  submitOrder: async function () {
    // 🔒 防重复提交：如果正在提交，直接忽略
    if (this.data.isSubmitting) {
      console.log('⚠️ 提交中，忽略重复点击');
      return;
    }

    // 设置提交状态
    this.setData({ isSubmitting: true });

    const {
      customerName,
      customerPhone,
      weight,
      volume,
      origin,
      destinationFirst,
      destinationSecond,
      remark
    } = this.data;

    // === 表单校验 ===
    if (!origin?.trim()) {
      wx.showToast({ title: '请输入取件地址', icon: 'none' });
      this.setData({ isSubmitting: false });
      return;
    }
    if (!destinationFirst?.trim()) {
      wx.showToast({ title: '请选择目的地区域', icon: 'none' });
      this.setData({ isSubmitting: false });
      return;
    }
    if (!destinationSecond?.trim()) {
      wx.showToast({ title: '请输入详细收货地址', icon: 'none' });
      this.setData({ isSubmitting: false });
      return;
    }
    if (!weight || isNaN(weight) || parseFloat(weight) <= 0) {
      wx.showToast({ title: '请输入有效重量（kg）', icon: 'none' });
      this.setData({ isSubmitting: false });
      return;
    }

    // 构建请求数据（完全匹配 OpenAPI）
    const requestData = {
      pickup_address: origin.trim(),
      delivery_address: `${destinationFirst.trim()} ${destinationSecond.trim()}`.trim(),
      weight_kg: parseFloat(weight),
      customer_name: customerName?.trim() || undefined,
      customer_phone: customerPhone?.trim() || undefined,
      description: remark?.trim() || undefined
    };

    // 过滤掉 undefined 字段（可选，但更干净）
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined) delete requestData[key];
    });

    try {
      wx.showLoading({ title: '提交中...', mask: true });

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://localhost:3000/api/public/orders',
          method: 'POST',
          header: {
            'Content-Type': 'application/json' // ⚠️ 必须显式声明！
          },
          data: requestData, // ← 是对象，不是字符串！
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      // === 处理响应 ===
      if (res.statusCode === 201) {
        const { order_id, tracking_code } = res.data || {};
        if (order_id) {
          // 保存临时订单 ID（可用于后续查询）
          wx.setStorageSync('tempOrderId', order_id);
          this.setData({ tempOrderId: order_id });

          wx.showToast({ title: '下单成功', icon: 'success', duration: 1500 });
          
          // ✅ 跳转到物流跟踪页（推荐用 order_id，也可用 tracking_code）
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/track/track?id=${order_id}`
            });
          }, 1000);
        } else {
          wx.showToast({ title: '成功但未返回订单ID', icon: 'none' });
        }
      } else {
        const errMsg = res.data?.error || res.data?.message || `请求失败 (${res.statusCode})`;
        wx.showToast({ title: errMsg, icon: 'none', duration: 2000 });
        console.error('下单失败:', res);
      }

    } catch (error) {
      wx.hideLoading();
      console.error('网络请求异常:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      // 🔓 无论成功/失败，都要解锁提交按钮
      this.setData({ isSubmitting: false });
    }
  },

  // 页面加载（可选：恢复临时订单）
  onLoad() {
    const savedId = wx.getStorageSync('tempOrderId');
    if (savedId) {
      this.setData({ tempOrderId: savedId });
    }
  }
});