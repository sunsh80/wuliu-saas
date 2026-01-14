// pages/login/login.js
Page({
  data: {
    email: '',      // 改为 email（符合 OpenAPI）
    password: ''
  },

  bindEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  bindPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  login() {
    const email = this.data.email.trim();
    const password = this.data.password.trim();

    // 前端验证
    if (!email || !password) {
      wx.showToast({ title: '请输入邮箱和密码', icon: 'none' });
      return;
    }

    // 邮箱格式简单校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    // 调用新 API：/api/tenant-web/login
    wx.request({
      url: 'http://localhost:3000/api/tenant-web/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        email: email,
        password: password
      },
      success: (res) => {
        wx.hideLoading();
        console.log('登录响应:', res);

        if (res.statusCode === 200) {
          // 登录成功：后端通过 Set-Cookie 设置 session
          // 小程序无法直接使用 Cookie，故用本地标记表示已登录
          wx.setStorageSync('isLoggedIn', true);
          wx.showToast({ title: '登录成功', icon: 'success' });

          // 跳转到首页（tabBar 页面必须用 switchTab）
          wx.switchTab({
            url: '/pages/index/index',
            success: () => {
              console.log('跳转到首页成功');
            },
            fail: (err) => {
              console.error('跳转失败:', err);
            }
          });
        } else {
          // 处理登录失败
          const errMsg = res.data?.message || '用户名或密码错误';
          wx.showToast({ title: errMsg, icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误，请检查连接', icon: 'none' });
      }
    });
  }
});