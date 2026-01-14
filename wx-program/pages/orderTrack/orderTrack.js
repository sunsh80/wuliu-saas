// miniprogram/pages/orderTrack/orderTrack.js
Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    error: '',
    showLoginPrompt: false,
    isCustomerView: false,
    // --- 新增数据 ---
    carrierQuotes: [],
    selectedCarrierId: '',
    timeRemaining: '',
    timer: null
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
          url: `http://localhost:3000/api/public/orders/${orderId}`, // 请替换为您的实际API地址
          method: 'GET',
          header: { 'Content-Type': 'application/json' },
          success: resolve,
          fail: reject
        });
      });
      if (res.statusCode === 200) {
        const order = res.data;
        // --- 修改: 增加 'quoted' 状态 ---
        const needLogin = ['claimed', 'in_transit', 'delivered'].includes(order.status);
        // --- END 修改 ---
        this.setData({ order, loading: false, showLoginPrompt: needLogin, isCustomerView: false });

        // --- 新增逻辑: 检查状态并加载报价 ---
        if (order.status === 'quoted') {
            if (this.data.isCustomerView) {
                // 如果已经是客户视图，直接加载报价
                this.loadQuotes(orderId);
            } else {
                // 如果是公共视图，提示登录以查看报价
                this.setData({ showLoginPrompt: true });
            }
        }
        // --- END 新增逻辑 ---

      } else if (res.statusCode === 404) {
        this.showError('订单不存在');
      } else {
        this.showError(res.data?.message || `加载失败 (${res.statusCode})`);
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
          url: `http://localhost:3000/api/customer/orders/${orderId}`, // 请替换为您的实际API地址
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // 请确保您的API使用此格式
          },
          success: resolve,
          fail: reject
        });
      });
      if (res.statusCode === 200) {
        const order = res.data;
        this.setData({ order: order, showLoginPrompt: false, isCustomerView: true });

         // --- 新增逻辑: 检查状态并加载报价 ---
         if (order.status === 'quoted') {
             this.loadQuotes(orderId);
             // 如果有报价截止时间，启动倒计时
             if (order.quote_deadline) {
                 this.startCountdown(order.quote_deadline);
             }
         }
         // --- END 新增逻辑 ---

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
                url: `http://localhost:3000/api/customer/orders/${orderId}/quotes`, // 请替换为您的实际API地址
                method: 'GET',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                success: resolve,
                fail: reject
            });
        });

        if (res.statusCode === 200) {
            this.setData({ carrierQuotes: res.data.data || [] });
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
  // --- END 新增方法 ---

  // --- 新增方法: 倒计时 ---
  startCountdown(deadlineStr) {
    if (!deadlineStr) return;
    // 清除旧定时器
    if (this.data.timer) clearInterval(this.data.timer);

    const deadline = new Date(deadlineStr).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        clearInterval(timer);
        this.setData({ timeRemaining: '已过期', timer: null });
        // 倒计时结束，可能需要刷新状态，看业务需求
        // this.fetchOrderData(this.data.orderId);
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        this.setData({ timeRemaining: `${min}分${sec}秒` });
      }
    }, 1000);

    this.setData({ timer });
  },
  // --- END 新增方法 ---

  // --- 新增方法: 选择承运商 (卡片点击) ---
  onQuoteCardTap(e) {
      const carrierId = e.currentTarget.dataset.carrierId;
      console.log('Selected Carrier ID:', carrierId);
      this.setData({ selectedCarrierId: carrierId });
  },
  // --- END 新增方法 ---

  // --- 新增方法: 确认选择 ---
  async onSelectCarrier() {
    const { orderId, selectedCarrierId, carrierQuotes } = this.data;

    if (!selectedCarrierId) {
      wx.showToast({ title: '请选择承运方', icon: 'none' });
      return;
    }

    // 二次确认
    const carrierName = this.getCarrierNameById(selectedCarrierId);
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
    const token = wx.getStorageSync('authToken');
    if (!token) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.promptLogin();
        return;
    }

    wx.showLoading({ title: '提交中...', mask: true });

    try {
        const res = await new Promise((resolve, reject) => {
            wx.request({
                url: `http://localhost:3000/api/customer/orders/${orderId}/select-carrier`, // 请替换为您的实际API地址
                method: 'POST', // 或 PUT
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: { carrier_tenant_id: selectedCarrierId }, // 注意字段名可能需要根据后端API调整
                success: resolve,
                fail: reject
            });
        });

        if (res.statusCode === 200) {
            wx.hideLoading();
            wx.showToast({ title: '选择成功', icon: 'success' });
            // 选择成功后，刷新页面以获取最新的订单状态
            setTimeout(() => this.fetchOrderData(orderId), 1000);
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
  // --- END 新增方法 ---

  // --- 新增方法: 辅助函数 ---
  getCarrierNameById(id) {
     const found = this.data.carrierQuotes.find(item => item.carrier_tenant_id === id);
     return found ? (found.carrier_tenant_name || '未知承运商') : '未知承运商';
  },
  // --- END 新增方法 ---

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
      content: '该订单已被承运商报价，请登录以查看报价并选择承运商。',
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

  // 手动重试（可选，与下拉刷新互补）
  onRefresh() {
    this.setData({ loading: true, error: '' });
    this.fetchOrderData(this.data.orderId);
  },

  // WXML 辅助方法
  getStatusText(status) {
    const map = {
      created: '待认领',
      claimed: '已认领',
      in_transit: '运输中',
      delivered: '已送达',
      cancelled: '已取消',
      // --- 新增状态 ---
      quoted: '待选择'
      // --- END 新增状态 ---
    };
    return map[status] || status;
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    return isoStr.replace('T', ' ').substring(0, 16);
  },

  // --- 新增生命周期: 页面卸载时清理定时器 ---
  onUnload() {
    if (this.data.timer) {
        clearInterval(this.data.timer);
    }
  }
  // --- END 新增生命周期 ---
});