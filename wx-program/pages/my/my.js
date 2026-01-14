// pages/my/my.js
const BASE_URL = 'http://localhost:3000/api';

function apiRequest(url, options = {}) {
  const token = wx.getStorageSync('token');
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.message || `请求失败 (${res.statusCode})`));
        }
      },
      fail: () => reject(new Error('网络错误')),
    });
  });
}

Page({
  data: {
    userInfo: null,
    userLoggedIn: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = wx.getStorageSync('isLoggedIn'); // 兼容 session 登录

    if ((token || isLoggedIn) && userInfo) {
      this.setData({ userInfo, userLoggedIn: true });
    } else {
      this.setData({ userInfo: null, userLoggedIn: false });
    }
  },

  // 微信登录（保留）
  async handleLogin() {
    wx.showLoading({ title: '微信登录中...' });
    try {
      const code = (await wx.login()).code;
      const res = await apiRequest('/users/wxlogin', {
        method: 'POST',
        data: { code }
      });

      if (res.token && res.user) {
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user);
        wx.setStorageSync('isLoggedIn', true);
        this.setData({ userInfo: res.user, userLoggedIn: true });
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        throw new Error('登录失败');
      }
    } catch (err) {
      wx.showToast({ title: err.message || '微信登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  handleLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('isLoggedIn');
          this.setData({ userInfo: null, userLoggedIn: false });
          wx.showToast({ title: '已登出', icon: 'success' });
        }
      }
    });
  }
});