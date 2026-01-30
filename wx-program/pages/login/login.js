// pages/login/login.js

Page({
  data: {
    loginMethod: 'email', // 默认登录方式 'email' 或 'phone'
    email: '',
    phone: '',
    password: ''
  },

  // 输入框绑定函数
  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },
  bindPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 切换登录方式
  toggleLoginMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      loginMethod: method
    });
  },
// 登录处理
login() {
  let value = '';
  const password = this.data.password;

  if (!password || !password.trim()) {
    wx.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }

  if (this.data.loginMethod === 'email') {
    value = this.data.email.trim();
    if (!value) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
      return;
    }
  } else if (this.data.loginMethod === 'phone') {
    value = this.data.phone.trim();
    if (!value) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    const { validatePhone } = require('../../utils/validation-rules.js');
    if (!validatePhone(value)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
  } else {
    wx.showToast({ title: '无效的登录方式', icon: 'none' });
    return;
  }

  // 显示加载提示
  wx.showLoading({ title: '登录中...', });

  // 发起登录请求
  wx.request({
    url: 'http://192.168.2.250:3000/api/tenant-web/login', // 使用正确的后端API地址
    method: 'POST',
    header: {
      'content-type': 'application/json'
    },
    data: {
      [this.data.loginMethod]: value, // 动态键名，如 { email: 'xxx' } 或 { phone: 'xxx' }
      password: password
    },
    success: (res) => {
      wx.hideLoading();
      console.log('🔍 login.js - 登录响应状态码:', res.statusCode);
    console.log('🔍 login.js - 登录响应头 (all):', res.header);
    console.log('🔍 login.js - 登录响应头 set-cookie:', res.header['set-cookie'], 'Set-Cookie:', res.header['Set-Cookie']);
      if (res.statusCode === 200 && res.data.success) {
        wx.showToast({ title: '登录成功', icon: 'success', duration: 2000 });

        // 登录成功后保存状态和token
        wx.setStorageSync('isLoggedIn', true);
        if (res.data.token) {
          wx.setStorageSync('token', res.data.token);
        }
        if (res.data.data) {
          wx.setStorageSync('userInfo', res.data.data); // 假设返回用户信息
        }

// --- 修改后的 Cookie 处理逻辑 ---
// 尝试从响应头获取 Set-Cookie
let rawCookieString = res.header['set-cookie'] || res.header['Set-Cookie'] || res.header['set-Cookie'.toLowerCase()];

if (rawCookieString) {
  // 检查 rawCookieString 是否是字符串
  if (typeof rawCookieString === 'string') {
    console.log('🔍 login.js - 获取到的 Set-Cookie 字符串:', rawCookieString);

    // 尝试按换行符分割，应对可能合并的情况 (虽然通常在单个请求响应中不太可能)
    let cookieLines = rawCookieString.split('\n').map(line => line.trim());

    for (let line of cookieLines) {
      // 检查每一行是否以 connect.sid= 开头
      if (line.startsWith('connect.sid=')) {
        // 提取 connect.sid=... 部分 (直到第一个分号)
        const sessionId = line.split(';')[0];
        console.log('🔍 login.js - 提取出的 sessionId:', sessionId);

        if (sessionId) {
          wx.setStorageSync('connect.sid', sessionId);
          console.log('✅ 登录成功, Cookie 已保存到本地存储:', sessionId);
          break; // 找到就退出循环
        }
      }
    }
  } else if (Array.isArray(rawCookieString)) {
    // 如果是数组，按照原来的方式迭代
    console.log('🔍 login.js - 获取到的 Set-Cookie 数组:', rawCookieString);
    for (let cookieLine of rawCookieString) {
      if (cookieLine && cookieLine.startsWith('connect.sid=')) {
        const sessionId = cookieLine.split(';')[0];
        console.log('🔍 login.js - 从数组项提取的 sessionId:', sessionId);
        if (sessionId) {
          wx.setStorageSync('connect.sid', sessionId);
          console.log('✅ 登录成功, Cookie 已保存到本地存储:', sessionId);
          break;
        }
      }
    }
  } else {
    console.warn('⚠️ login.js - Set-Cookie 响应头格式未知:', typeof rawCookieString, rawCookieString);
  }
} else {
  console.warn('⚠️ login.js - 登录成功，但在响应头中未找到 Set-Cookie');
}
// --- 修改结束 ---

        // 跳转到首页
        wx.switchTab({ url: '/pages/index/index', }); // 或者跳转到订单页，取决于您的应用逻辑
      } else {
        // 处理后端返回的错误
        const errorMessage = res.data.message || res.data.error || '登录失败，请稍后重试';
        wx.showToast({ title: errorMessage, icon: 'none' });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      console.error('登录请求失败:', err);
      wx.showToast({ title: '网络错误，请检查网络连接', icon: 'none' });
    }
  });
},
  // 新增：跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/company-register/company-register' // 注册页的路径
    });
  },

  // 页面加载时检查登录状态
  onLoad() {
     // 检查本地是否有登录状态
     if (wx.getStorageSync('isLoggedIn')) {
         // 如果已登录，可以直接跳转到首页
         wx.switchTab({
           url: '/pages/index/index',
         });
     }
  }

  // 或者使用 onShow，每次页面显示都检查（更频繁）
  // onShow() {
  //   if (wx.getStorageSync('isLoggedIn')) {
  //       wx.switchTab({
  //         url: '/pages/index/index',
  //       });
  //   }
  // }
});