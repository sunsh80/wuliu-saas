// WULIU_PROJECT/miniprogram/pages/orderComparison/orderComparison.js

Page({
  data: {
    orders: [] // 存储订单列表及其报价
  },

  onLoad: function (options) {
    // 页面加载时获取订单列表
    this.loadOrdersWithBids();
  },

  loadOrdersWithBids: function () {
    wx.showLoading({
      title: '加载中...',
    });

    // 假设后端有一个 API 返回订单和关联的报价
    wx.request({
      url: 'http://localhost:3000/api/tenant/orders-with-bids', // 需要后端实现此API
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token') // 如果需要认证
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          console.log('获取订单列表成功:', res.data);
          this.setData({
            orders: res.data
          });
        } else {
          console.error('获取订单列表失败:', res.data);
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('请求失败:', error);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadOrdersWithBids();
    wx.stopPullDownRefresh(); // 停止下拉刷新动画
  },

  // 选择报价 (未来功能)
  selectBid: function(e) {
    const orderId = e.currentTarget.dataset.orderId;
    const bidId = e.currentTarget.dataset.bidId;
    console.log(`用户选择订单 ${orderId} 的报价 ${bidId}`);

    // wx.request({
    //   url: `http://localhost:3000/api/orders/${orderId}/select-bid`,
    //   method: 'POST',
    //   data: { bidId: bidId },
    //   header: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer ' + wx.getStorageSync('token')
    //   },
    //   success: (res) => {
    //     if (res.statusCode === 200) {
    //       wx.showToast({
    //         title: '选择成功',
    //         icon: 'success'
    //       });
    //       // 可以刷新页面或更新UI
    //       this.loadOrdersWithBids();
    //     } else {
    //       wx.showToast({
    //         title: '选择失败',
    //         icon: 'none'
    //       });
    //     }
    //   },
    //   fail: (error) => {
    //     console.error('选择报价失败:', error);
    //     wx.showToast({
    //       title: '网络错误',
    //       icon: 'none'
    //     });
    //   }
    // });
  },

  // 可选：添加定时轮询
  pollTimer: null,

  onShow: function () {
    // 页面显示时开始轮询 (可选)
    // this.startPolling();
  },

  onHide: function () {
    // 页面隐藏时停止轮询 (可选)
    // this.stopPolling();
  },

  startPolling: function () {
    this.pollTimer = setInterval(() => {
      this.loadOrdersWithBids();
    }, 30000); // 每30秒请求一次
  },

  stopPolling: function () {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
});