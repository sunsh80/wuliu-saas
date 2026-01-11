// miniprogram/pages/orderStatus/orderStatus.js
const app = getApp();

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.fetchOrder(id);
    } else {
      wx.showToast({ title: '无效订单', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async fetchOrder(orderId) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    wx.showLoading({ title: '加载中...' });

    try {
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
        this.setData({ order: res.data });
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
      console.error('fetchOrder error:', err);
    }
  },

  // 返回列表
  goBack() {
    wx.navigateBack();
  }
});