// pages/company-register/company-register.js
Page({
  data: {
    contact_phone: '',
    password: '',
    confirmPassword: '',
    selectedRole: null,
    roleOptions: [
      { label: '我是客户', value: 'customer' },
      { label: '我是承运商', value: 'carrier' }
    ]
  },

  bindContactPhoneInput(e) {
    this.setData({ contact_phone: e.detail.value });
  },
  bindPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  bindConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },
  onRoleChange(e) {
    this.setData({ selectedRole: e.detail.value });
  },

  submitRegister() {
    const { contact_phone, password, confirmPassword, selectedRole } = this.data;

    if (!contact_phone || !contact_phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (!confirmPassword) {
      wx.showToast({ title: '请再次输入密码', icon: 'none' });
      return;
    }
    if (!selectedRole) {
      wx.showToast({ title: '请选择用户类型', icon: 'none' });
      return;
    }

    // --- 使用与后端一致的手机号验证规则 ---
    const cleanedPhoneNumber = contact_phone.trim();
    console.log("Debug - Input phone:", contact_phone, "Cleaned phone:", cleanedPhoneNumber);

    // 使用与openapi.yaml和后端一致的正则表达式：^1[3-9]\d{9}$
    const phoneRegex = /^1[3-9]\d{9}$/;
    let isPhoneValid = phoneRegex.test(cleanedPhoneNumber);

    if (!isPhoneValid) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      console.log("Debug - Manual Phone validation FAILED for:", cleanedPhoneNumber);
      return;
    } else {
       console.log("Debug - Manual Phone validation PASSED for:", cleanedPhoneNumber);
    }

    if (password.length < 6) {
      wx.showToast({ title: '密码长度至少为6位', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return;
    }

    // 调用后端接口进行最终验证和注册
    if (selectedRole === 'customer') {
      this.handleCustomerRegistration(cleanedPhoneNumber, password);
    } else if (selectedRole === 'carrier') {
      this.handleCarrierRegistration();
    }
  },

  handleCustomerRegistration(phone, password) {
    wx.showLoading({ title: '注册中...' });

    wx.request({
      url: 'http://localhost:3000/api/tenant-web/register', // 使用与openapi.yaml一致的URL
      method: 'POST',
      data: {
        contact_phone: phone, // 符合CustomerWebRegistration schema
        password: password,   // 符合CustomerWebRegistration schema
        roles: ['customer']   // 符合CustomerWebRegistration schema
      },
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        console.log('Backend Response:', res); // 调试日志 - 完整响应
        // --- 新增：详细打印错误信息 ---
        if (res.data && res.data.errors) {
             console.log('Backend Validation Errors:', res.data.errors); // 打印具体的错误详情
        }
        // --- 新增结束 ---
        wx.hideLoading();

        if (res.statusCode === 201 || (res.statusCode === 200 && res.data && res.data.success)) {
          if (res.data && res.data.success) {
            wx.showToast({ title: res.data.message || '注册成功', icon: 'success' });
            wx.setStorageSync('isLoggedIn', true);
            // 保存 token 和 userInfo (如果后端返回)
            // wx.setStorageSync('token', res.data.token);
            // wx.setStorageSync('userInfo', res.data.userInfo);
            wx.switchTab({ url: '/pages/index/index' });
          } else {
            // 显示后端返回的具体错误信息
            // --- 修改：优先显示 errors 中的详细信息 ---
            let errorMessage = res.data.message || '注册失败';
            if (res.data.errors && res.data.errors.length > 0) {
                // 假设 errors 是一个对象数组，每个对象有 param 和 msg
                errorMessage = res.data.errors.map(err => err.param + ': ' + err.msg).join(', ');
            }
            wx.showToast({ title: errorMessage, icon: 'none' });
            // --- 修改结束 ---
          }
        } else {
          // 处理 HTTP 错误状态码
          let errorMsg = '服务器错误 (' + res.statusCode + ')';
          if (res.data && res.data.message) {
            errorMsg = res.data.message;
          }
          wx.showToast({ title: errorMsg, icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('Network Error:', err); // 调试日志
        wx.hideLoading();
        wx.showToast({ title: '网络连接失败', icon: 'none' });
      }
    });
  },   
  handleCarrierRegistration() {
    wx.showModal({
      title: '前往PC端注册',
      content: '承运商注册需要更多信息，请前往PC端进行注册。',
      showCancel: false,
      confirmText: '我知道了',
      success: (modalRes) => {
        if (modalRes.confirm) {
          wx.showModal({
            title: '提示',
            content: '请打开电脑浏览器，访问 https://your-pc-site.com/register-carrier 进行注册',
            showCancel: false,
            confirmText: '复制链接',
            success: (copyRes) => {
              if (copyRes.confirm) {
                wx.setClipboardData({
                  data: 'https://your-pc-site.com/register-carrier', // 替换为实际链接
                  success: () => wx.showToast({ title: '链接已复制', icon: 'none' }),
                  fail: () => wx.showToast({ title: '复制失败，请手动复制', icon: 'none' })
                });
              }
            }
          });
        }
      }
    });
  }
});