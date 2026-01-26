// miniprogram/pages/orderList/orderList.js

Page({
  data: {
    orders: [], // 存储订单列表
    loading: true,
    refreshing: false, // 标记是否正在刷新
  },

  onLoad() {
    this.fetchOrders();
    if (this.data.goodsMainCategory) {
        this.updateMainCategoryIndex();
    }
  },

  onShow() {
    // 页面显示时，通常也会刷新列表以获取最新状态
    // 但如果用户刚从详情页返回，可能不需要立即刷新，可根据需求调整
    // this.fetchOrders();
  },

  /**
   * 从后端API获取订单列表
   */
  async fetchOrders() {
    // 判断是否需要刷新状态来决定是否显示loading
    const showLoading = !this.data.refreshing;

    if (showLoading) {
      wx.showLoading({ title: '加载中...' });
    }

    const token = wx.getStorageSync('authToken'); // 假设登录后存了token
    if (!token) {
      wx.hideLoading();
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' }); // 假设登录页路径
          }, 1500);
        }
      });
      return;
    }

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://192.168.2.250/api/customer/orders', // 请替换为实际API地址
          method: 'GET',
          header: {
            'Authorization': `Bearer  $ {token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200) {
        // 假设后端返回的是订单数组
        // 按照订单创建时间降序排列，最新的在前
        const sortedOrders = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        this.setData({ orders: sortedOrders, loading: false });
      } else if (res.statusCode === 401) {
        // Token失效，清除缓存并跳转登录
        wx.removeStorageSync('authToken');
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          success: () => {
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' });
            }, 1500);
          }
        });
      } else {
        const msg = res.data?.message || `加载失败 ( $ {res.statusCode})`;
        wx.showToast({ title: msg, icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('fetchOrders error:', err);
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  /**
   * 点击订单列表项，跳转到订单详情页
   * @param {Object} e - 事件对象
   */
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    if (orderId) {
      // 跳转到订单详情页，传递订单ID
      wx.navigateTo({
        url: `/pages/orderTrack/orderTrack?id= $ {orderId}` // 使用 orderTrack 作为详情页
      });
    } else {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
    }
  },

  /**
   * 下拉刷新生命周期函数
   */
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.fetchOrders().finally(() => {
      // 停止下拉刷新动画
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  /**
   * 页面上拉触底事件，可用于加载更多订单（如果需要分页）
   */
  // onReachBottom() {
  //   // 实现加载更多逻辑
  // },

  /**
   * 辅助函数：根据状态码获取状态文本
   * @param {string} status - 订单状态
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const map = {
      created: '待发布',
      published: '已发布',
      matching: '匹配中',
      quoting: '报价中',
      accepted: '已接受',
      in_transit: '运输中',
      delivered: '已送达',
      cancelled: '已取消',
      expired: '已过期',
      // 'quoted' 状态可能在 orderTrack.js 中更常见
    };
    return map[status] || status;
  }
});