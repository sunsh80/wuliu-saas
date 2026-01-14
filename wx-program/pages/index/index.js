// pages/index/index.js
Page({
  goToOrder() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || wx.getStorageSync('token');
    if (!isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.goToLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/order/order' });
  },

  goToLogs() {
    wx.navigateTo({ url: '/pages/logs/logs' });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});