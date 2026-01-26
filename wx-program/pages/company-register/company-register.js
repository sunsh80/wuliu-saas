// pages/company-register/company-register.js

Page({
  data: {
    name: '', // 公司/租户名称
    email: '', // 邮箱
    contact_person: '', // 联系人
    contact_phone: '', // 手机号
    password: '', // 密码
    confirmPassword: '', // 确认密码
    selectedRole: null, // 选中的角色 ("carrier" 或 "customer")
    roleOptions: [
      { label: '租户承运商', value: 'carrier' },
      { label: '租户客户', value: 'customer' }
    ]
  },

  // 输入框绑定函数
  bindNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },
  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },
  bindContactPersonInput(e) {
    this.setData({
      contact_person: e.detail.value
    });
  },
  bindContactPhoneInput(e) {
    this.setData({
      contact_phone: e.detail.value
    });
  },
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },
  bindConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 单选按钮选择角色
  onRoleChange(e) {
    const selectedValue = e.detail.value;
    this.setData({
      selectedRole: selectedValue
    });
  },

  // 提交注册
  submitRegister() {
    const { name, email, contact_person, contact_phone, password, confirmPassword, selectedRole } = this.data;

    // 前端基础验证
    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入公司/租户名称',
        icon: 'none'
      });
      return;
    }
    if (!email || !email.trim()) {
      wx.showToast({
        title: '请输入邮箱',
        icon: 'none'
      });
      return;
    }
    if (!contact_person || !contact_person.trim()) {
      wx.showToast({
        title: '请输入联系人',
        icon: 'none'
      });
      return;
    }
    if (!contact_phone || !contact_phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    if (!confirmPassword) {
      wx.showToast({
        title: '请再次输入密码',
        icon: 'none'
      });
      return;
    }
    if (!selectedRole) {
      wx.showToast({
        title: '请选择公司类别',
        icon: 'none'
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+ $ /;
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9} $ /;
    if (!phoneRegex.test(contact_phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少为6位',
        icon: 'none'
      });
      return;
    }

    // 验证密码一致性
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '提交中...',
    });

    // 发起注册请求
    wx.request({
      url: 'http://192.168.2.250/api/tenant-web/register', // 替换为你的实际API地址
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        name: name.trim(),
        email: email.trim(),
        contact_person: contact_person.trim(),
        contact_phone: contact_phone.trim(),
        password: password,
        roles: [selectedRole === 'carrier' ? 'carrier' : 'customer'] // 根据选择的角色确定
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '注册成功',
            icon: 'success',
            duration: 2000
          });
          // 注册成功后保存登录状态和可能的 token
          wx.setStorageSync('isLoggedIn', true);
          if (res.data.token) {
            wx.setStorageSync('token', res.data.token);
          }
          if (res.data.data) {
             wx.setStorageSync('userInfo', res.data.data); // 假设返回用户信息
          }
          // 跳转到首页或其他成功页面
          wx.switchTab({
            url: '/pages/index/index', // 替换为你想要跳转的页面
          });
        } else {
          // 处理后端返回的错误
          const errorMessage = res.data.message || res.data.error || '注册失败，请稍后重试';
          wx.showToast({
            title: errorMessage,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('注册请求失败:', err);
        wx.showToast({
          title: '网络错误，请检查网络连接',
          icon: 'none'
        });
      }
    });
  }
});