// pages/index/index.js
Page({
  data: {
    // ... 其他 data ...
    isLoggedIn: false, // 添加一个数据项来标记登录状态
  },

  onLoad() {
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || wx.getStorageSync('token'); // 根据实际情况选择一个检查方式

    // --- 修改：总是检查状态并更新 data ---
    this.setData({
      isLoggedIn: !!isLoggedIn // !! 用于确保结果是布尔值 true 或 false
    });

    // 可以保留其他初始化逻辑
    wx.setNavigationBarTitle({
      title: '蚁到达无人物流'
    });
  },

  // ... 其他方法 (goToLogs) 保持不变 ...

  // 添加 goToOrder 方法
  goToOrder() {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      // 可以选择在此处跳转到登录页
      // wx.navigateTo({
      //   url: '/pages/login/login'
      // });
      return; // 阻止后续跳转逻辑执行
    }

    // 如果已登录，则跳转到订单页
    wx.navigateTo({
      url: '/pages/order/order'
    });
  },

  // 添加 goToRegister 方法 (用于【公司入驻】按钮)
  goToRegister() {
    wx.navigateTo({
      url: '/pages/company-register/company-register'
    });
  },

  // 添加 goToLogin 方法 (如果需要在UI上提供登录入口)
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 添加 goToMyProfile 方法 (如果需要)
  goToMyProfile() {
    wx.navigateTo({
      url: '/pages/my/my'
    });
  },

  // 添加 goToLogs 方法 (如果需要)
  goToLogs() {
    wx.navigateTo({
      url: '/pages/logs/logs'
    });
  }

  // 注意：这里需要一个闭合的大括号 '}' 来结束 Page({...})
});