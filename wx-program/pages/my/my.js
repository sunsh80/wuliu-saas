// pages/my/my.js
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

  /**
   * 检查用户登录状态
   * 兼容旧的 isLoggedIn/userInfo 模式和新的 connect.sid 模式
   */
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn'); // 旧的登录标记
    const userInfo = wx.getStorageSync('userInfo');     // 用户信息
    const connectSid = wx.getStorageSync('connect.sid'); // 新的会话 ID

    // 如果任一有效的登录凭据存在，则认为已登录
    // 方案一：旧的 isLoggedIn + userInfo
    // 方案二：新的 connect.sid (只要有值就算登录)
    if ((isLoggedIn && userInfo) || connectSid) {
      this.setData({
        userInfo: userInfo || null, // 如果 userInfo 存在则使用，否则保持 null
        userLoggedIn: true          // 设置为已登录状态
      });
    } else {
      // 如果以上凭据都不存在，则设置为未登录状态
      this.setData({
        userInfo: null,
        userLoggedIn: false
      });
    }
  },

  /**
   * 处理登录/注册按钮点击
   */
  handleLogin() {
    // 跳转到登录页面
    wx.navigateTo({
      url: '../login/login',
    });
  },

  /**
   * 处理退出登录按钮点击
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除所有登录相关的本地存储
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          wx.removeStorageSync('connect.sid');

          // 更新页面数据
          this.setData({
            userInfo: null,
            userLoggedIn: false
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 可以在这里添加 navigateToSettings, navigateToRecharge, navigateToPoints 等函数
  navigateToSettings() {
    // 示例：跳转到设置页面
    console.log("跳转到设置页面");
  },

  navigateToRecharge() {
    // 示例：跳转到充值页面
    console.log("跳转到充值页面");
  },

  navigateToPoints() {
    // 示例：跳转到积分管理页面
    console.log("跳转到积分管理页面");
  }
});