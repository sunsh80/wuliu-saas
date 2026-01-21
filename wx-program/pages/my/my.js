// pages/my/my.js

// 注意：BASE_URL 和 apiRequest 函数在此文件中似乎未被使用，如果确实不需要，可以考虑删除。
// 如果未来需要调用租户相关的 API，可能需要调整 BASE_URL 和 token 的获取方式。
// const BASE_URL = 'http://localhost:3000/api';

// function apiRequest(url, options = {}) { 
//   const token = wx.getStorageSync('token'); 
//   return new Promise((resolve, reject) => { 
//     wx.request({ 
//       url: BASE_URL + url, 
//       method: options.method || 'GET', 
//       data: options.data, 
//       header: { 
//         'Content-Type': 'application/json', 
//         ...(token ? { Authorization: `Bearer ${token}` } : {}), 
//       }, 
//       success: (res) => { 
//         if (res.statusCode >= 200 && res.statusCode < 300) { 
//           resolve(res.data); 
//         } else { 
//           reject(new Error(res.data?.message || `请求失败 (${res.statusCode})`)); 
//         } 
//       }, 
//       fail: () => reject(new Error('网络错误')), 
//     }); 
//   }); 
// }

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
    // 检查是否已登录 (兼容新旧两种登录方式)
    // 方案一：只要 isLoggedIn 为 true 且 userInfo 存在，就认为已登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const userInfo = wx.getStorageSync('userInfo');

    if (isLoggedIn && userInfo) {
      this.setData({
        userInfo: userInfo,
        userLoggedIn: true
      });
    } else {
      // 方案二：如果需要兼容旧的 token 登录方式，可以这样检查
      // const token = wx.getStorageSync('token');
      // if ((token || isLoggedIn) && userInfo) { 
      //   this.setData({
      //     userInfo: userInfo,
      //     userLoggedIn: true
      //   });
      // } else {
      //   this.setData({
      //     userInfo: null,
      //     userLoggedIn: false
      //   });
      // }
      this.setData({
        userInfo: null,
        userLoggedIn: false
      });
    }
  },

  // --- 移除或修改微信登录逻辑 ---
  // 如果不再使用微信登录，可以移除此函数，或将其改为跳转到登录页
  // handleLogin() {
  //   wx.navigateTo({
  //     url: '/pages/login/login', // 跳转到登录页面
  //   });
  // }

  // 保持登录状态检查
  handleLogin() {
     // 如果仍有微信登录的需求，保留原逻辑；否则，改为导航到新登录页
     // 例如，跳转到登录选择页
     wx.navigateTo({
       url: '/pages/login/login', // 跳转到新的邮箱/手机号登录页
     });
  },

  handleLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除所有登录相关的缓存
          wx.removeStorageSync('token');        // 清除旧的 token
          wx.removeStorageSync('userInfo');     // 清除用户信息
          wx.removeStorageSync('isLoggedIn');   // 清除登录状态标记

          this.setData({
            userInfo: null,
            userLoggedIn: false
          });
          
          wx.showToast({
            title: '已登出',
            icon: 'success'
          });
        }
      }
    });
  }
});