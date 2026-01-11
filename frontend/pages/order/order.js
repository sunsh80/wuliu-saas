// miniprogram/pages/order/order.js
const app = getApp();

Page({
  data: {
    customerName: '',
    customerPhone: '',
    weight: '',
    volume: '',
    origin: '',
    destinationFirst: '',
    destinationSecond: '',
    remark: '',
    tempOrderId: null,
  },

  // --- 输入绑定事件 ---
  bindCustomerNameInput(e) {
    this.setData({ customerName: e.detail.value });
  },
  bindCustomerPhoneInput(e) {
    this.setData({ customerPhone: e.detail.value });
  },
  bindWeightInput(e) {
    this.setData({ weight: e.detail.value });
  },
  bindVolumeInput(e) {
    this.setData({ volume: e.detail.value });
  },
  bindOriginInput(e) {
    this.setData({ origin: e.detail.value });
  },
  bindDestinationFirstInput(e) {
    this.setData({ destinationFirst: e.detail.value });
  },
  bindDestinationSecondInput(e) {
    this.setData({ destinationSecond: e.detail.value });
  },
  bindRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // --- 提交订单逻辑 ---
  submitOrder: async function () {
    console.log('--- 开始执行 submitOrder 函数 ---');
    const {
      customerName,
      customerPhone,
      weight,
      volume,
      origin,
      destinationFirst,
      destinationSecond,
      remark
    } = this.data;

    // 1. 前端校验必填项 (根据API要求)
    if (!origin.trim()) {
      wx.showToast({ title: '请输入提货地', icon: 'none' });
      return;
    }
    if (!destinationFirst.trim() || !destinationSecond.trim()) {
      wx.showToast({ title: '请输入完整目的地', icon: 'none' });
      return;
    }
    if (!weight.trim()) {
      wx.showToast({ title: '请输入货物重量', icon: 'none' });
      return;
    }

    // 2. 构建请求体，严格遵循新的OpenAPI结构
    const requestData = {
      pickup_address: origin.trim(),
      delivery_address: `${destinationFirst.trim()} ${destinationSecond.trim()}`.trim(),
      weight_kg: parseFloat(weight),
    };

    // 3. 添加可选字段（仅当有值时）
    if (customerName.trim()) requestData.customer_name = customerName.trim();
    if (customerPhone.trim()) requestData.customer_phone = customerPhone.trim();

    // 4. 将 volume 和 remark 合并到 description 字段中
    const descParts = [];
    if (volume.trim()) descParts.push(`体积: ${volume.trim()} m³`);
    if (remark.trim()) descParts.push(remark.trim());
    if (descParts.length > 0) requestData.description = descParts.join('; ');

    console.log('准备发送的订单数据:', requestData);

    try {
      wx.showLoading({ title: '提交中...' });

      // 5. 发起请求到正确的API端点
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://localhost:3000/api/public/orders', // 确保此URL与你的后端部署地址一致
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: requestData,
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      // 6. 处理响应
      if (res.statusCode === 201) {
        // 假设成功创建后，后端返回 { order_id: "xxx" }
        const orderId = res.data?.order_id;
        if (orderId) {
          wx.setStorageSync('tempOrderId', orderId);
          this.setData({ tempOrderId: orderId });
          wx.showToast({ title: '订单创建成功', icon: 'success' });
          wx.navigateTo({ url: `/pages/track/track?id=${orderId}` });
        } else {
          wx.showToast({ title: '成功但未返回ID', icon: 'none' });
          console.error('响应缺少 order_id:', res.data);
        }
      } else {
        // 处理业务错误或HTTP错误
        const errMsg = res.data?.message || `请求失败 (${res.statusCode})`;
        wx.showToast({ title: errMsg, icon: 'none' });
        console.error('订单提交失败:', res);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '网络请求失败', icon: 'none' });
      console.error('submitOrder error:', error);
    }

    console.log('--- submitOrder 函数执行完毕 ---');
  }
});