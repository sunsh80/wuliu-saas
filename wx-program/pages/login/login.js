// pages/login/login.js
Page({
  data: {
    loginMethod: 'phone', // 'phone' 或 'email'
    email: '',
    phone: '',
    password: ''
  },

  // 输入绑定
  bindEmailInput(e) {
    this.setData({ email: e.detail.value });
  },
  bindPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },
  bindPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 切换登录方式
  toggleLoginMethod(e) {
    this.setData({ loginMethod: e.currentTarget.dataset.method });
  },

  // 登录主逻辑
  login() {
    const { loginMethod, email, phone, password } = this.data;

    let value = '';
    if (loginMethod === 'email') {
      value = email.trim();
      if (!value || !value.includes('@')) {
        wx.showToast({ title: '请输入有效邮箱', icon: 'none' });
        return;
      }
    } else {
      value = phone.trim();
      if (!/^1[3-9]\d{9}$/.test(value)) {
        wx.showToast({ title: '请输入有效手机号', icon: 'none' });
        return;
      }
    }

    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    wx.request({
      url: 'http://192.168.2.250:3000/api/tenant-web/login',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        [loginMethod]: value,
        password: password
      },
      success: (res) => {
        console.log('【Debug】Response Headers:', res.header);
console.log('【Debug】Response Cookies:', res.cookies);
        wx.hideLoading();

        console.log('🔍 login2.js - 登录响应状态码:', res.statusCode);
        console.log('🔍 login2.js - 响应数据:', res.data);

        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });

          // === 1. 存储通用登录状态 ===
          wx.setStorageSync('isLoggedIn', true);

          // === 2. 存储 Token（后端返回结构：res.data.data.token）===
          const token = res.data.data?.token || res.data.token;
          if (token) {
            wx.setStorageSync('token', token);
            console.log('✅ token 已保存:', token.substring(0, 20) + '...');
          } else {
            console.error('❌ 未找到 token！res.data:', res.data);
          }

          // === 3. 存储用户信息 ===
          if (res.data.data) {
            wx.setStorageSync('userInfo', res.data.data);
          }

          // === 4.// 安全提取 connect.sid（无任何 ES6+ 依赖）
       let connectSidValue = null;

// 方法 1：优先使用 res.cookies（微信新版本）
const cookies = res.cookies || [];
for (let i = 0; i < cookies.length; i++) {
  if (cookies[i].name === 'connect.sid') {
    connectSidValue = cookies[i].value;
    break;
  }
}

// 方法 2：降级使用 res.header（兼容旧版本/模拟器）
if (!connectSidValue) {
  const setCookieHeader = res.header['set-cookie'] || res.header['Set-Cookie'];
  if (Array.isArray(setCookieHeader)) {
    for (let i = 0; i < setCookieHeader.length; i++) {
      if (setCookieHeader[i].startsWith('connect.sid=')) {
        connectSidValue = setCookieHeader[i].split(';')[0].replace('connect.sid=', '');
        break;
      }
    }
  } else if (typeof setCookieHeader === 'string' && setCookieHeader.startsWith('connect.sid=')) {
    connectSidValue = setCookieHeader.split(';')[0].replace('connect.sid=', '');
  }
}

// 存储 Session ID
if (connectSidValue) {
  wx.setStorageSync('connect_sid', connectSidValue);
  console.log('✅ connect_sid 已保存:', connectSidValue);
}
          // 跳转首页
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' });
          }, 1000);
        } else {
          const msg = res.data.message || '登录失败，请重试';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('网络请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 跳转注册页
  goToRegister() {
    wx.navigateTo({ url: '/pages/company-register/company-register' });
  },

  // 页面加载时检查登录状态
  onLoad() {
    if (wx.getStorageSync('isLoggedIn')) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});