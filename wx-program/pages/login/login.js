// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loginMethod: 'email', // 'email' or 'phone'
    email: '',
    phone: '',
    password: ''
  },

  /**
   * 监听邮箱输入
   */
  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  /**
   * 监听手机号输入
   */
  bindPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  /**
   * 监听密码输入
   */
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 切换登录方式
   */
  toggleLoginMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      loginMethod: method
    });
  },

  /**
   * 登录处理函数
   */
  login() {
    const { loginMethod, email, phone, password } = this.data;
    const trimmedPassword = password.trim();

    // 前端基础验证
    if (!trimmedPassword) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    let identifierValue = '';
    let identifierType = '';

    if (loginMethod === 'email') {
      identifierValue = email.trim();
      identifierType = '邮箱';
      if (!identifierValue) {
        wx.showToast({
          title: '请输入邮箱',
          icon: 'none'
        });
        return;
      }
      // 邮箱格式简单校验
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifierValue)) {
        wx.showToast({
          title: '邮箱格式不正确',
          icon: 'none'
        });
        return;
      }
    } else if (loginMethod === 'phone') {
      identifierValue = phone.trim();
      identifierType = '手机号';
      if (!identifierValue) {
        wx.showToast({
          title: '请输入手机号',
          icon: 'none'
        });
        return;
      }
      // 手机号格式校验
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(identifierValue)) {
        wx.showToast({
          title: '手机号格式不正确',
          icon: 'none'
        });
        return;
      }
    } else {
      // 防止意外的 loginMethod 值
      wx.showToast({
        title: '登录方式错误',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...'
    });

    // 调用登录 API
    wx.request({
      url: 'http://localhost:3000/api/tenant/loginTenantWeb', // 请确保 URL 正确
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        // 根据选择的登录方式发送对应的字段
        [loginMethod]: identifierValue, // 动态键名，如果是 'email'，则发送 { email: value }；如果是 'phone'，则发送 { phone: value }
        password: trimmedPassword
      },
      success: (res) => {
        wx.hideLoading();
        console.log('登录响应:', res);

        if (res.statusCode === 200) {
          if (res.data.success) {
            // 登录成功：后端通过 Set-Cookie 设置 session
            // 小程序无法直接使用 Cookie，故用本地标记表示已登录
            wx.setStorageSync('isLoggedIn', true);
            // 如果后端返回了 token，也可以存储
            if (res.data.data && res.data.data.token) {
                 wx.setStorageSync('token', res.data.data.token);
            }
            // 可选：存储用户信息
            if (res.data.data) {
                wx.setStorageSync('userInfo', res.data.data);
            }

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });

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
            // 处理登录失败 (res.data.success === false)
            const errMsg = res.data?.error || '登录失败，请稍后重试';
            wx.showToast({
              title: errMsg,
              icon: 'none'
            });
          }
        } else {
          // 处理 HTTP 错误状态码
          const errMsg = res.data?.error || `登录失败 (${res.statusCode})`;
          wx.showToast({
            title: errMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误，请检查连接',
          icon: 'none'
        });
      }
    });
  }
});