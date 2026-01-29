// miniprogram/pages/orderTrack/orderTrack.js

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    error: '',
    showLoginPrompt: false,
    isCustomerView: false,

    // --- 新增数据：承运商报价 ---
    carrierQuotes: [], // 存储报价列表
    sortedQuotes: [],  // 存储排序后的报价列表
    selectedCarrierId: '', // 当前选中的承运商ID
    sortingOption: 'time', // 默认排序方式: time, price, rating
    timeRemaining: '', // 显示倒计时字符串
    timer: null,       // 存储倒计时定时器ID
    // --- END 新增数据 ---
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '无效订单ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ orderId: id });
    this.fetchOrderData(id);
  },

  // 统一的数据获取入口（公共 + 客户视图）
  async fetchOrderData(orderId) {
    // 先尝试公共接口
    await this.fetchPublicOrder(orderId);
    // 如果已有 token 且需要客户视图，自动升级
    const token = wx.getStorageSync('authToken');
    if (token && this.data.showLoginPrompt && !this.data.isCustomerView) {
      await this.upgradeToCustomerView(orderId);
    }
  },

  // 公共接口：匿名查询
  async fetchPublicOrder(orderId) {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://192.168.2.250/api/public/orders/${orderId}`, // 请替换为您的实际API地址
          method: 'GET',
          header: { 'Content-Type': 'application/json' },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        const order = res.data;
        // 根据状态判断是否需要登录才能查看详细信息（如报价）
        const needLogin = ['claimed', 'awarded', 'dispatched', 'in_transit', 'delivered'].includes(order.status);

        this.setData({
          order,
          loading: false,
          showLoginPrompt: needLogin,
          isCustomerView: false
        });

        // 检查状态并加载报价
        if (order.status === 'quoted') {
          if (this.data.isCustomerView) {
            // 如果已经是客户视图，直接加载报价
            this.loadQuotes(orderId);
          } else {
            // 如果是公共视图，提示登录以查看报价
            this.setData({ showLoginPrompt: true });
          }
        }

      } else if (res.statusCode === 404) {
        this.showError('订单不存在');
      } else {
        this.showError(res.data?.message || `加载失败 ( $ {res.statusCode})`);
      }
    } catch (err) {
      console.error('fetchPublicOrder error:', err);
      this.showError('网络错误');
    }
  },

  // 客户接口：登录后查询
  async upgradeToCustomerView(orderId) {
    const token = wx.getStorageSync('authToken');
    if (!token) return;

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://192.168.2.250/api/customer/orders/${orderId}`, // 请替换为您的实际API地址
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer  $ {token}` // 请确保您的API使用此格式
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        const order = res.data;
        this.setData({
          order: order,
          showLoginPrompt: false,
          isCustomerView: true
        });

        // 检查并自动绑定订单 ---
        // 条件1: 订单尚未绑定客户 (public 视图下 customer_id 为 null)
        // 条件2: 用户已登录且有手机号
        if (!order.customer_id) {
          const userInfo = wx.getStorageSync('userInfo') || {};
          const customerPhone = userInfo.contact_phone || userInfo.phone; // 对齐字段
          if (customerPhone) {
            console.log('尝试自动绑定订单:', orderId, '到手机号:', customerPhone);
            await this.bindOrderToCustomer(orderId, customerPhone);
            // 绑定后重新获取最新订单数据（含 customer_id）
            await this.fetchPublicOrder(orderId); // 注意：这里先走 public 接口确保一致性
          }
        }
        // --- 检查状态并加载报价 ---
        if (order.status === 'quoted') {
          this.loadQuotes(orderId);
          if (order.quote_deadline) {
    this.startCountdown(order.quote_deadline);
        }
        }

      } else if (res.statusCode === 401) {
        wx.removeStorageSync('authToken');
        this.promptLogin();
      } else {
        this.showError('您无权查看此订单详情');
      }
    } catch (err) {
      console.error('upgradeToCustomerView error:', err);
    }
  },

  // -- 绑定订单到客户 ---
  async bindOrderToCustomer(orderId, phone) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `http://192.168.2.250/api/customer/order/bind`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { order_id: orderId, phone: phone }, // 假设后端需要手机号验证
        withCredentials: true, // 👈 关键！携带登录 Cooki 
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            console.log('✅ 订单绑定成功');
            wx.showToast({ title: '订单已关联', icon: 'success', duration: 1000 });
            resolve();
          } else {
            console.warn('❌ 绑定失败:', res.data?.error || '未知错误');
            // 不抛出错误，避免阻断后续流程
            resolve();
          }
        },
        fail: (err) => {
          console.error('❌ 绑定网络错误:', err);
          wx.showToast({ title: '绑定失败', icon: 'none' });
          resolve(); // 仍继续流程
        }
      });
    });
  },

  // --- 新增方法: 加载报价 ---
  async loadQuotes(orderId) {
    const token = wx.getStorageSync('authToken');
    if (!token) {
      console.error("No token available for loading quotes.");
      return;
    }

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://192.168.2.250/api/customer/orders/${orderId}/quotes`, // 请替换为您的实际API地址
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer  $ {token}`
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        let quotes = res.data.data || [];
        // 假设后端返回的数据结构为 [{carrier_id, carrier_name, vehicle_brand, distance, quote_price, rating, ...}]
        // 可以在这里对报价数据进行预处理，例如计算综合得分等
        // 示例：为每条报价添加一个计算好的综合得分
        // quotes = quotes.map(quote => ({
        //   ...quote,
        //   score: calculateScore(quote.quote_price, quote.rating, quote.estimated_arrival_time)
        // }));

        this.setData({
        sortedQuotes: sorted,
      sortingOption: sortBy
        });
        // 初始排序
        this.sortQuotes();
      } else if (res.statusCode === 401) {
        wx.removeStorageSync('authToken');
        this.promptLogin();
      } else {
        console.error("Failed to load quotes:", res);
        // 可以选择不显示错误，因为可能只是暂无报价
      }
    } catch (err) {
      console.error('loadQuotes error:', err);
    }
  },

  // --- 新增方法: 排序报价 ---
  sortQuotes(option = null) {
    const sortBy = option || this.data.sortingOption;
    const quotes = [...this.data.carrierQuotes]; // 避免直接修改原数组

    let sorted = [];
    switch (sortBy) {
      case 'price':
        sorted = quotes.sort((a, b) => a.quote_price - b.quote_price); // 价格低到高
        break;
      case 'rating':
        sorted = quotes.sort((a, b) => b.rating - a.rating); // 评分高到低
        break;
      case 'time':
      default:
        // 假设有预计到达时间 estimated_arrival_time
        sorted = quotes.sort((a, b) => new Date(a.estimated_arrival_time) - new Date(b.estimated_arrival_time)); // 时间早到晚
        break;
    }

    this.setData({
      sortedQuotes: sorted,
      sortingOption: sortBy
    });
  },

// --- 新增方法: 排序报价 ---
  sortQuotes(option = null) {
    const sortBy = option || this.data.sortingOption;
    const quotes = [...this.data.carrierQuotes]; // 避免直接修改原数组

    let sorted = [];
    switch (sortBy) {
      case 'price':
        sorted = quotes.sort((a, b) => a.price - b.price); // 价格低到高
        break;
      case 'rating':
        sorted = quotes.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)); // 评分高到低
        break;
      case 'time':
      default:
        // 按预计到达时间排序
        sorted = quotes.sort((a, b) => new Date(a.estimated_arrival || a.created_at) - new Date(b.estimated_arrival || b.created_at));
        break;
    }

    this.setData({
      sortedQuotes: sorted,
      sortingOption: sortBy
    });
  },

  // --- 新增方法: 排序选项切换 ---
  onSortChange(e) {
    const option = e.currentTarget.dataset.option;
    this.sortQuotes(option);
  },

  // --- 新增方法: 选择承运商 (卡片点击) ---
  onQuoteCardTap(e) {
    const carrierId = e.currentTarget.dataset.carrierId;
    console.log('Selected Carrier ID:', carrierId);
    this.setData({ selectedCarrierId: carrierId });
  },

  // --- 新增方法: 确认选择 ---
  async onSelectCarrier() {
    const { orderId, selectedCarrierId, sortedQuotes } = this.data;
    if (!selectedCarrierId) {
      wx.showToast({ title: '请选择承运方', icon: 'none' });
      return;
    }

    // 找到选中的报价
    const selectedQuote = sortedQuotes.find(q => q.carrier_tenant_id === selectedCarrierId);
    const carrierName = selectedQuote ? selectedQuote.carrier_tenant_name : '未知承运商';

    wx.showModal({
      title: '确认选择',
      content: `您确定选择  $ {carrierName} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitSelection(orderId, selectedCarrierId);
        }
      }
    });
  },

  // --- 新增方法: 提交选择 ---
  async submitSelection(orderId, selectedCarrierId) {
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const res = wx.request({
        url: `http://192.168.2.250/api/customer/orders/${orderId}/award`, // 请替换为您的实际API地址
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { carrier_tenant_id: selectedCarrierId },
        withCredentials: true, // ✅ 关键！携带 Cookie
        timeout: 10000
      });

      if (res.statusCode === 200 && res.data.success) {
        wx.hideLoading();
        wx.showToast({ title: '选择成功', icon: 'success' });
        // 选择成功后，刷新订单详情，状态应该变为 awarded 或 dispatched
        setTimeout(() => {
          this.fetchOrderData(orderId);
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

  // --- 新增方法: 启动倒计时 ---
  startCountdown(deadline) {
    // 清除旧的定时器
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
            // 可以在这里触发一些UI变化，比如禁用选择按钮
            return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) {
            timeString = ` $ {days}天  $ {hours}小时`;
        } else if (hours > 0) {
            timeString = ` $ {hours}小时  $ {minutes}分钟`;
        } else if (minutes > 0) {
            timeString = ` $ {minutes}分钟  $ {seconds}秒`;
        } else {
            timeString = ` $ {seconds}秒`;
        }

        this.setData({ timeRemaining: `报价剩余:  $ {timeString}` });
    };

    // 立即执行一次更新
    updateTimer();
    // 设置定时器，每秒更新一次
    const timerId = setInterval(updateTimer, 1000);
    this.setData({ timer: timerId });
  },
  // --- END 新增方法: 启动倒计时 ---

  // --- 新增方法: 辅助函数 ---
  getCarrierNameById(id) {
    const found = this.data.sortedQuotes.find(item => item.carrier_tenant_id === id);
    return found ? (found.carrier_tenant_name || '未知承运商') : '未知承运商';
  },

  // 下拉刷新生命周期（关键！）
  onPullDownRefresh() {
    // 重新拉取数据
    this.fetchOrderData(this.data.orderId).finally(() => {
      // 停止下拉刷新动画
      wx.stopPullDownRefresh();
    });
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
            url: `/pages/login/login?redirect=/pages/orderTrack/orderTrack?id= $ {this.data.orderId}`
          });
        }
      }
    });
  },

  onLoginClick() {
    this.promptLogin();
  },

  // 手动重试（可选，与下拉刷新互补）
  onRefresh() {
    this.setData({ loading: true, error: '' });
    this.fetchOrderData(this.data.orderId);
  },

  // WXML 辅助方法 (依据 openapi.yaml 定义的状态)
  getStatusText(status) {
    const map = {
      created: '待认领',        // 权威状态
      claimed: '待选择',        // 权威状态，此时可能有报价
      awarded: '已分配',        // 权威状态
      dispatched: '已发车',     // 权威状态
      in_transit: '运输中',     // 权威状态
      delivered: '已送达',      // 权威状态
      cancelled: '已取消',      // 权威状态
      // 'quoted' 状态不在权威列表中，但为了向后兼容或UI过渡，也可以保留
      // quoted: '待选择',
    };
    return map[status] || status; // 如果状态不在映射中，返回原始状态
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    return isoStr.replace('T', ' ').substring(0, 16);
  },

  // --- 新增生命周期: 页面卸载时清理 ---
  onUnload() {
    // 清理倒计时定时器
    if (this.data.timer) {
        clearInterval(this.data.timer);
    }
  }
  // --- END 新增生命周期 ---
});