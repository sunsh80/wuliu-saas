// miniprogram/pages/orderList/orderList.js
const app = getApp();

Page({
  data: {
    orders: [],
    loading: true
  },

  onLoad() {
    this.fetchOrders();
  },

  async fetchOrders() {
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
          url: 'http://localhost:3000/api/customer/orders',
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
        this.setData({ orders: res.data || [] });
      } else {
        const msg = res.data?.message || `加载失败 (${res.statusCode})`;
        wx.showToast({ title: msg, icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      console.error('fetchOrders error:', err);
    }
  },

  // 点击订单跳转详情
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    if (orderId) {
      wx.navigateTo({ url: `/pages/orderStatus/orderStatus?id=${orderId}` });
    }
  }
});