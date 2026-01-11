// miniprogram/pages/orderTrack/orderTrack.js
const app = getApp();

Page({
  data: {
    order: null,
    responses: [],
    selectedCarrierId: '',
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.fetchOrderAndResponses(id);
    } else {
      wx.showToast({ title: '无效订单', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async fetchOrderAndResponses(orderId) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    wx.showLoading({ title: '加载中...' });

    try {
      // 获取订单详情（含响应列表）
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://localhost:3000/api/customer/orders/${orderId}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200) {
        const order = res.data;
        // 假设 responses 是 order 的一个字段（由后端返回）
        this.setData({
          order,
          responses: order.responses || []
        });
      } else if (res.statusCode === 404) {
        wx.showToast({ title: '订单不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        const msg = res.data?.message || `加载失败 (${res.statusCode})`;
        wx.showToast({ title: msg, icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      console.error('fetchOrderAndResponses error:', err);
    }
  },

  // 选择承运商
  selectCarrier(e) {
    const carrierId = e.currentTarget.dataset.carrierId;
    this.setData({ selectedCarrierId: carrierId });
  },

  // 确认选择
  async confirmSelection() {
    const { order, selectedCarrierId } = this.data;
    if (!selectedCarrierId) {
      wx.showToast({ title: '请选择承运商', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    wx.showLoading({ title: '确认中...' });

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://localhost:3000/api/customer/orders/${order.order_id}/select-carrier`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            carrier_id: selectedCarrierId
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200) {
        wx.showToast({ title: '已确认承运商', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/orderStatus/orderStatus?id=${order.order_id}` });
        }, 1500);
      } else {
        const msg = res.data?.message || `操作失败 (${res.statusCode})`;
        wx.showToast({ title: msg, icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      console.error('confirmSelection error:', err);
    }
  }
});