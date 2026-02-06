// miniprogram/pages/orderTrack/orderTrack.js
const request = require('../../utils/request.js');

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    error: '',
    showLoginPrompt: false,
    isCustomerView: false,
    carrierQuotes: [],
    sortedQuotes: [],
    selectedCarrierId: '',
    sortingOption: 'time',
    timeRemaining: '',
    timer: null,
    quotes: [],
    loadingQuotes: false,
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '无效订单ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      this.setData({ loading: false }); // 结束加载状态
      return;
    }
    this.setData({ orderId: id });
    this.checkLoginAndLoadOrder(id);
  },

  checkLoginAndLoadOrder(orderId) {
    const token = wx.getStorageSync('token');
    const connectSid = wx.getStorageSync('connect.sid');

    // 检查是否有任一认证凭据
    if (!token && !connectSid) {
      this.promptLogin();
      return;
    }
    this.loadOrderDetail(orderId);
  },

  async loadOrderDetail(orderId) {
    try {
      const res = await request({
        url: `/api/customer/orders/${orderId}`,
        method: 'GET'
      });
      // request模块成功时，res.data.success一定是true
      const order = res.data.data;

      // 解析地址信息
      let parsedSenderInfo = {};
      let parsedReceiverInfo = {};

      console.log('订单数据:', order); // 调试信息

      try {
        if (typeof order.sender_info === 'string') {
          parsedSenderInfo = JSON.parse(order.sender_info);
          console.log('解析发货人信息:', parsedSenderInfo); // 调试信息
        } else {
          parsedSenderInfo = order.sender_info || {};
          console.log('发货人信息对象:', parsedSenderInfo); // 调试信息
        }
      } catch (e) {
        console.error('解析发货人信息失败:', e);
        parsedSenderInfo = {};
      }

      try {
        if (typeof order.receiver_info === 'string') {
          parsedReceiverInfo = JSON.parse(order.receiver_info);
          console.log('解析收货人信息:', parsedReceiverInfo); // 调试信息
        } else {
          parsedReceiverInfo = order.receiver_info || {};
          console.log('收货人信息对象:', parsedReceiverInfo); // 调试信息
        }
      } catch (e) {
        console.error('解析收货人信息失败:', e);
        parsedReceiverInfo = {};
      }

      // 处理订单数据，准备展示
      const processedOrder = {
        ...order,
        statusText: this.getStatusText(order.status),
        formattedCreatedAt: this.formatTime(order.createdAt || order.created_at),
        formattedCompletedAt: this.formatTime(order.completedAt || order.completed_at),
        // 预留车辆位置信息
        vehiclePosition: null, // 后续用于实时车辆位置
        routeHistory: [], // 后续用于路线历史
        // 确保承运商信息正确展示
        carrier_tenant_name: order.carrier?.name || order.carrier?.tenantName || '未分配',
        carrier_contact_phone: order.carrier?.phone || order.carrier?.contact_phone || '未提供',
        // 确保客户信息正确展示
        customer_tenant_name: order.customer?.tenantName || '未知客户',
        // 确保地址信息正确展示
        pickup_address: parsedSenderInfo.address || order.sender?.address || parsedSenderInfo.name || order.sender?.name || '未指定',
        delivery_address: parsedReceiverInfo.address || order.receiver?.address || parsedReceiverInfo.name || order.receiver?.name || '未指定',
        // 添加订单流程状态
        orderTimeline: this.buildOrderTimeline(order),
      };

      this.setData({
        order: processedOrder,
        showLoginPrompt: false,
        isCustomerView: true,
        loading: false  // 结束加载状态
      });

      // 后端已经通过 customer_tenant_id 进行了权限验证
      // 不需要额外的订单绑定逻辑

      if (order.status === 'quoted') {
        this.loadQuotes(orderId);
        if (order.quote_deadline) {
          this.startCountdown(order.quote_deadline);
        }
      }
    } catch (err) {
      console.error('loadOrderDetail error:', err);
      if (err.message === '未登录' || err.message === '登录过期') {
        this.setData({ loading: false }); // 结束加载状态
        this.promptLogin();
      } else {
        this.showError('网络错误或您无权查看此订单详情');
        this.setData({ loading: false }); // 结束加载状态
      }
    }
  },

  async bindOrderToCustomer(orderId, phone) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `http://localhost:3000/api/customer/order/bind`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'cookie': wx.getStorageSync('connect.sid') || ''
        },
        data: { order_id: orderId, phone: phone },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            console.log('✅ 订单绑定成功');
            wx.showToast({ title: '订单已关联', icon: 'success', duration: 1000 });
            resolve();
          } else {
            console.warn('❌ 绑定失败:', res.data?.error || '未知错误');
            resolve();
          }
        },
        fail: (err) => {
          console.error('❌ 绑定网络错误:', err);
          wx.showToast({ title: '绑定失败', icon: 'none' });
          resolve();
        }
      });
    });
  },

  async loadQuotes(orderId) {
    this.setData({ loadingQuotes: true });
    try {
      const res = await request({
        url: `/api/customer/orders/${orderId}/quotes`,
        method: 'GET'
      });
      // request模块成功时，res.data.success一定是true
      const rawQuotes = res.data.data || [];
      this.setData({ quotes: rawQuotes, loadingQuotes: false });
      let processedQuotes = rawQuotes.map(q => ({
        ...q,
        carrier: { ...q.carrier, name: q.carrier.name || q.carrier.tenant_name }
      }));
      this.setData({ carrierQuotes: processedQuotes });
      this.sortQuotes();
    } catch (err) {
      console.error('loadQuotes error:', err);
      if (err.message === '未登录' || err.message === '登录过期') {
        this.promptLogin();
      } else {
        console.error("Failed to load quotes:", err);
        this.setData({ loadingQuotes: false });
      }
    }
  },

  sortQuotes(option = null) {
    const sortBy = option || this.data.sortingOption;
    const quotes = [...this.data.carrierQuotes];
    let sorted = [];
    switch (sortBy) {
      case 'price':
        sorted = quotes.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        sorted = quotes.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case 'time':
      default:
        sorted = quotes.sort((a, b) => new Date(a.delivery_time) - new Date(b.delivery_time));
        break;
    }
    this.setData({ sortedQuotes: sorted, sortingOption: sortBy });
  },

  onSortChange(e) {
    const option = e.currentTarget.dataset.option;
    this.sortQuotes(option);
  },

  onQuoteCardTap(e) {
    const carrierId = e.currentTarget.dataset.carrierId;
    console.log('Selected Carrier ID:', carrierId);
    this.setData({ selectedCarrierId: carrierId });
  },

  async onSelectCarrier() {
    const { orderId, selectedCarrierId, sortedQuotes } = this.data;
    if (!selectedCarrierId) {
      wx.showToast({ title: '请选择承运方', icon: 'none' });
      return;
    }
    const selectedQuote = sortedQuotes.find(q => q.carrier.id === selectedCarrierId);
    const carrierName = selectedQuote ? (selectedQuote.carrier.name || selectedQuote.carrier.tenant_name || '未知承运商') : '未知承运商';
    wx.showModal({
      title: '确认选择',
      content: `您确定选择 ${carrierName} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitSelection(orderId, selectedCarrierId);
        }
      }
    });
  },

  async submitSelection(orderId, selectedCarrierId) {
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await request({
        url: `/api/customer/orders/${orderId}/award`,
        method: 'POST',
        data: { carrier_tenant_id: selectedCarrierId }
      });
      if (res.statusCode === 200 && res.data.success) {
        wx.hideLoading();
        wx.showToast({ title: '选择成功', icon: 'success' });
        setTimeout(() => {
          this.loadOrderDetail(orderId);
        }, 1000);
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.data?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('submitSelection error:', err);
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },

  startCountdown(deadline) {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const timeDiff = deadlineTime - now;
      if (timeDiff <= 0) {
        clearInterval(this.data.timer);
        this.setData({ timeRemaining: '已截止', timer: null });
        return;
      }
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      let timeString = '';
      if (days > 0) {
        timeString = `${days}天 ${hours}小时`;
      } else if (hours > 0) {
        timeString = `${hours}小时 ${minutes}分钟`;
      } else if (minutes > 0) {
        timeString = `${minutes}分钟 ${seconds}秒`;
      } else {
        timeString = `${seconds}秒`;
      }
      this.setData({ timeRemaining: `报价剩余: ${timeString}` });
    };
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    this.setData({ timer: timerId });
  },

  getCarrierNameById(id) {
    const found = this.data.sortedQuotes.find(item => item.carrier.id === id);
    return found ? (found.carrier.name || found.carrier.tenant_name || '未知承运商') : '未知承运商';
  },

  showError(msg) {
    this.setData({ error: msg, loading: false });
    wx.showToast({ title: msg, icon: 'none', duration: 2000 });
  },

  promptLogin() {
    wx.showModal({
      title: '需要登录',
      content: '该订单状态需要登录以查看详细信息或进行操作。',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/login/login?redirect=/pages/orderTrack/orderTrack?id=${this.data.orderId}`
          });
        }
      }
    });
  },

  onLoginClick() {
    this.promptLogin();
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    return isoStr.replace('T', ' ').substring(0, 16);
  },

  getStatusText(status) {
    const map = {
      created: '待认领',
      pending_claim: '待认领',
      claimed: '待选择',
      quoted: '待选择',
      awarded: '已分配',
      dispatched: '已发车',
      in_transit: '运输中',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return map[status] || status;
  },

  // 构建订单时间线
  buildOrderTimeline(order) {
    const timeline = [];

    // 获取当前订单状态的索引，用于判断哪些阶段已完成
    const statusOrder = ['created', 'processed', 'quoted', 'awarded', 'dispatched', 'in_transit', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);

    // 订单创建
    timeline.push({
      status: 'created',
      statusText: '订单创建',
      timestamp: order.createdAt || order.created_at,
      completed: true,
      description: '客户下单，订单已创建'
    });

    // 后台审核/处理
    const isProcessedCompleted = currentStatusIndex >= statusOrder.indexOf('processed');
    timeline.push({
      status: 'processed',
      statusText: '后台处理',
      timestamp: isProcessedCompleted ? order.updated_at : null,
      completed: isProcessedCompleted,
      description: isProcessedCompleted ? '后台已处理订单' : '等待后台处理'
    });

    // 报价阶段
    const isQuotedCompleted = currentStatusIndex >= statusOrder.indexOf('quoted');
    timeline.push({
      status: 'quoted',
      statusText: '承运商报价',
      timestamp: isQuotedCompleted ? (order.quoteDeliveryTime || order.updated_at) : null,
      completed: isQuotedCompleted,
      description: isQuotedCompleted ? '承运商已提交报价' : '等待承运商报价'
    });

    // 订单绑定/分配
    const isAwardedCompleted = currentStatusIndex >= statusOrder.indexOf('awarded');
    timeline.push({
      status: 'awarded',
      statusText: '订单分配',
      timestamp: isAwardedCompleted ? order.updated_at : null,
      completed: isAwardedCompleted,
      description: isAwardedCompleted ? '订单已分配给承运商' : '等待订单分配'
    });

    // 承运商承运
    const isDispatchedCompleted = currentStatusIndex >= statusOrder.indexOf('dispatched');
    timeline.push({
      status: 'dispatched',
      statusText: '已发车',
      timestamp: isDispatchedCompleted ? order.updated_at : null,
      completed: isDispatchedCompleted,
      description: isDispatchedCompleted ? '承运商已发车' : '等待承运商发车'
    });

    // 实时车辆状态
    const isInTransitCompleted = currentStatusIndex >= statusOrder.indexOf('in_transit');
    timeline.push({
      status: 'in_transit',
      statusText: '运输中',
      timestamp: isInTransitCompleted ? order.updated_at : null,
      completed: isInTransitCompleted,
      description: isInTransitCompleted ? '货物正在运输途中' : '货物运输中...'
    });

    // 订单完成
    const isDeliveredCompleted = currentStatusIndex >= statusOrder.indexOf('delivered');
    timeline.push({
      status: 'delivered',
      statusText: '已送达',
      timestamp: isDeliveredCompleted ? (order.completedAt || order.updated_at) : null,
      completed: isDeliveredCompleted,
      description: isDeliveredCompleted ? '订单已完成，货物已送达' : '等待订单完成'
    });

    return timeline;
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  }
});