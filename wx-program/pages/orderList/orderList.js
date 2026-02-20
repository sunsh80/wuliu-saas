// pages/orderList/orderList.js
const request = require('../../utils/request.js');

Page({
  data: {
    orders: [],
    loading: true,
    error: '',
    showRetry: false,
    emptyTip: ''
  },

  // 页面加载时执行
onLoad: function(options) {
  console.log('[OrderList] 页面加载，开始获取订单数据');

  // 🔍【关键诊断日志】检查认证凭证是否存在
  const connect_sid = wx.getStorageSync('connect_sid');
  const token = wx.getStorageSync('token');
  const isLoggedIn = wx.getStorageSync('isLoggedIn');
  
  console.log('[OrderList] Storage 状态:', {
    connect_sid: connect_sid || '❌ 未存储',
    token: token || '❌ 未存储',
    isLoggedIn: isLoggedIn || '❌ 未设置'
  });

  this.fetchOrders();
},

  // 页面显示时执行（每次进入页面都会执行）
  onShow: function() {
    console.log('[OrderList] 页面显示，刷新订单数据');
    // 每次进入页面都刷新数据
    this.fetchOrders();
  },

  async fetchOrders() {
    console.log('[OrderList] 开始获取订单数据...');
    // 设置加载状态
    this.setData({
      loading: true,
      error: '',
      showRetry: false,
      emptyTip: ''
    });

    try {
      console.log('[OrderList] 发起API请求: /api/customer/orders');
      const res = await request({
        url: '/api/customer/orders',
        method: 'GET',
        // showLoading: true // 这是默认值，可以省略
      });

      console.log('[OrderList] API响应:', res);

      if (res.statusCode === 200 && res.data.success) {
        const apiOrders = res.data.data?.orders;
        console.log('[OrderList] 从API获取到的原始订单数据:', apiOrders);

        if (Array.isArray(apiOrders)) {
          console.log('[OrderList] 订单数量:', apiOrders.length);

          // 如果订单数量为0，显示提示信息
          if (apiOrders.length === 0) {
            console.log('[OrderList] 用户没有订单数据');
            this.setData({
              orders: [],
              loading: false,
              emptyTip: '暂无订单'
            });
          } else {
            const processedOrders = apiOrders.map(order => ({
              ...order,
              statusText: this.getStatusText(order.status),
              formattedCreatedAt: this.formatTime(order.created_at)
            })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            console.log('[OrderList] 处理后的订单数据:', processedOrders);

            this.setData({
              orders: processedOrders,
              loading: false, // 请求完成后隐藏加载状态
              emptyTip: ''
            });
          }
        } else {
          console.error('[OrderList] Server success but data.orders format invalid:', apiOrders);
          this.setData({
            orders: [],
            error: '服务器返回的数据格式有误',
            showRetry: true,
            loading: false
          });
        }
      } else {
        console.log('[OrderList] API响应失败:', res);
        let errorMessage = '未知错误';
        if (typeof res.data?.message === 'string') {
          errorMessage = res.data.message;
        } else if (res.statusCode !== 200) {
          errorMessage = `请求失败(${res.statusCode})`;
        }
        this.setData({
          orders: [],
          error: errorMessage,
          showRetry: true,
          loading: false
        });
      }
    } catch (err) {
      console.error('fetchOrders request failed (rejected by request.js):', err);

      let errorMessage = '网络错误';
      if (err.message === '未登录') {
        errorMessage = '请先登录';
      } else if (err.message === '登录过期') {
        errorMessage = '登录已过期，请重新登录';
      }

      this.setData({
        orders: [],
        error: errorMessage,
        showRetry: true,
        loading: false
      });

      // 显示错误提示
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    }
  },

  // 订单详情跳转
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orderTrack/orderTrack?id=${orderId}`
    });
  },

  // 获取订单状态文本
  getStatusText(status) {
    const statusMap = {
      'created': '已创建',
      'pending': '待处理',
      'pending_claim': '待认领',
      'claimed': '已认领',
      'quoted': '已报价',
      'awarded': '已分配',
      'dispatched': '已发车',
      'in_transit': '运输中',
      'delivered': '已送达',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },

  // 重试功能
  onRetry() {
    console.log('[OrderList] 用户点击重试按钮');
    this.fetchOrders();
  }
});