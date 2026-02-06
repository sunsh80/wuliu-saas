// wx-program/app.js
App({
  // 全局数据 —— 直接硬编码默认配置，不依赖任何外部文件
  globalData: {
    isLoggedIn: false,
    userInfo: null,
    connectSid: null,
    token: null, // 注意：您代码中使用 token，但 utils/request.js 使用 authToken
    config: {
      API_BASE_URL: 'http://192.168.2.250:3000/api', // 👈 后端服务地址（可修改为线上域名）
      debug: true, // 👈 是否开启调试模式
    },
  },

  // 小程序启动时执行
  onLaunch: function () {
    console.log('🚀 小程序启动');
    // 初始化全局状态
    this.initGlobalState();
    // 检查登录状态
    this.checkLoginStatus(); // 👈 只检查状态，不跳转页面
  },

  // 页面显示时执行
  onShow: function () {
    console.log('📱 小程序从前台激活');
  },

  // 小程序进入后台时执行
  onHide: function () {
    console.log('⏸️ 小程序进入后台');
  },

  /**
   * 初始化全局状态
   */
  initGlobalState() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    const userInfo = wx.getStorageSync('userInfo') || null;
    const connectSid = wx.getStorageSync('connect.sid') || null;
    // 注意：您的 app.js 使用 token，但 request.js 使用 authToken。
    // 建议统一使用一个，这里按 app.js 的 token 存储为准。
    const token = wx.getStorageSync('token') || null; 
    this.globalData.isLoggedIn = isLoggedIn;
    this.globalData.userInfo = userInfo;
    this.globalData.connectSid = connectSid;
    this.globalData.token = token;

    console.log('✅ 全局状态初始化完成:', this.globalData);
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    console.log('🔍 检查登录状态...');
    console.log('   - Global State isLoggedIn:', this.globalData.isLoggedIn);
    console.log('   - Global State connectSid:', this.globalData.connectSid);

    // 检查本地是否有存储的登录凭证
    const storedIsLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    const storedConnectSid = wx.getStorageSync('connect.sid') || null;
    const storedUserInfo = wx.getStorageSync('userInfo') || null;

    if (storedIsLoggedIn && storedConnectSid) {
      console.log('   - 本地存储显示已登录，正在验证服务器端 Session...');
      this.validateSession(storedConnectSid);
    } else {
      console.log('   - 本地无有效登录凭证，设置为未登录状态');
      this.setLoggedOutState();
      // ❌ 移除：不再在这里跳转
      // this.navigateToLogin();
    }
  },

  /**
   * 验证 session 是否有效
   * @param {string} sid - connect.sid 的值
   */
  validateSession(sid) {
    const config = this.globalData.config;
    console.log('🔍 正在验证 Session 有效性...');

    // 使用 wx.request 直接调用，避免陷入 request.js 的循环依赖或复杂逻辑
    wx.request({
      url: config.API_BASE_URL + '/auth/ping',
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Cookie': sid, // 直接使用传入的 sid
      },
      success: (res) => {
        console.log('   - Session 验证请求发送成功');
        console.log('   - 服务器响应状态码:', res.statusCode);
        console.log('   - 服务器响应数据:', res.data);

        if (res.statusCode === 200 && res.data.success) {
          console.log('✅ Session 有效，用户已登录');
          // Session 有效，更新全局状态
          this.setLoggedInState(res.data.user, sid);
        } else {
          console.warn('⚠️ Session 无效或服务器返回失败:', res.data.message);
          this.handleInvalidSession(); // 👈 只处理无效状态，不跳转
        }
      },
      fail: (err) => {
        console.error('❌ Session 验证请求失败:', err);
        // 网络错误等，也视为 Session 无效
        this.handleInvalidSession(); // 👈 只处理无效状态，不跳转
      },
    });
  },

  /**
   * 处理无效 Session 的情况
   */
  handleInvalidSession() {
    console.log('🔄 检测到 Session 无效，正在清除登录状态...');
    this.clearLoginState();
    this.setLoggedOutState();
    // 可选：提示用户登录已过期
    // wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
    // ❌ 移除：不再在这里跳转
    // this.navigateToLogin();
  },

  /**
   * 设置登录状态
   * @param {Object} userInfo - 用户信息
   * @param {string} sid - connect.sid
   */
  setLoggedInState(userInfo, sid) {
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = userInfo;
    this.globalData.connectSid = sid; // 更新全局 connectSid

    // 同步更新本地存储
    wx.setStorageSync('isLoggedIn', true);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('connect.sid', sid); // 确保本地存储与全局状态一致

    console.log('✅ 全局登录状态已更新:', this.globalData);
  },

  /**
   * 设置登出状态
   */
  setLoggedOutState() {
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    this.globalData.connectSid = null;
    this.globalData.token = null; // 也清空 token

    console.log('🔄 全局状态已设为未登录');
  },

  /**
   * 清除登录状态
   */
clearLoginState() {
    wx.removeStorageSync('isLoggedIn');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('connect.sid');
    wx.removeStorageSync('token'); // 清除 token 存储
    wx.removeStorageSync('authToken'); // ✅ 也要清除 authToken 存储，防止 request.js 读取到无效的 authToken
    
    console.log('🧹 登录状态已从本地存储清除 (包括 token 和 authToken)');
  }

  // /**
  //  * 跳转到登录页
  //  */
  // navigateToLogin() {
  //   wx.redirectTo({
  //     url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index'),
  //   });
  // },
});