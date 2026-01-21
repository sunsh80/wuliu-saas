// pages/register/register.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '', // 公司/租户名称
    contact_person: '', // 联系人姓名
    contact_phone: '', // 联系人手机号
    email: '', // 联系人邮箱
    password: '', // 密码
    confirmPassword: '' // 确认密码
  },

  /**
   * 监听公司/租户名称输入
   */
  bindNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  /**
   * 监听联系人姓名输入
   */
  bindContactPersonInput(e) {
    this.setData({
      contact_person: e.detail.value
    });
  },

  /**
   * 监听联系人手机号输入
   */
  bindContactPhoneInput(e) {
    this.setData({
      contact_phone: e.detail.value
    });
  },

  /**
   * 监听联系人邮箱输入
   */
  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  /**
   * 监听密码输入
   */
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 监听确认密码输入
   */
  bindConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  /**
   * 提交注册
   */
  submitRegister() {
    const { name, contact_person, contact_phone, email, password, confirmPassword } = this.data;

    // 前端基础验证
    if (!name.trim()) {
      wx.showToast({
        title: '请输入公司/租户名称',
        icon: 'none'
      });
      return;
    }
    if (!contact_person.trim()) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return;
    }
    if (!contact_phone.trim()) {
      wx.showToast({
        title: '请输入联系人手机号',
        icon: 'none'
      });
      return;
    }
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(contact_phone.trim())) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }
    if (!email.trim()) {
      wx.showToast({
        title: '请输入联系人邮箱',
        icon: 'none'
      });
      return;
    }
    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none'
      });
      return;
    }
    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    // 简单密码强度校验 (示例：至少6位)
    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '注册中...'
    });

    // 调用后端注册 API
    // 注意：这里假设后端有一个 /api/tenant-web/register 的接口
    // 如果后端使用的是 /api/pc/tenants/apply，需要相应调整 URL 和请求体结构
    wx.request({
      url: 'http://localhost:3000/api/tenant-web/register', // 请根据后端实际提供的注册接口地址修改
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: name.trim(), // 租户名称
        contact_person: contact_person.trim(), // 联系人
        contact_phone: contact_phone.trim(), // 联系电话 (后端可能存为 contact_phone)
        email: email.trim(), // 邮箱 (后端可能存为 email)
        password: password, // 密码
        roles: ["customer"] // 固定角色为客户
        // 如果后端需要 username，可能也需要添加
        // username: email // 或者其他规则生成的用户名
      },
      success: (res) => {
        wx.hideLoading();
        console.log('注册响应:', res);

        if (res.statusCode === 200) {
          if (res.data.success) {
             // 注册成功：后端可能设置了 session (如果走的是 login 流程)
             // 或者返回了 token，这里假设注册成功后用户处于登录状态或需要自动登录
             // 一种常见做法是注册成功后，直接尝试用刚注册的凭据登录
             // 但这会增加一次请求。另一种做法是后端在注册成功后直接返回 session cookie。
             // 这里我们假设注册成功后，用户凭据已与后端 session 绑定。
             // 小程序无法直接使用 Cookie，故用本地标记表示已登录
             wx.setStorageSync('isLoggedIn', true);
             // 如果后端注册成功后返回了 token，也可以存储
             if (res.data.data && res.data.data.token) {
                 wx.setStorageSync('token', res.data.data.token);
             }
             // 可选：存储用户信息
             if (res.data.data) {
                 wx.setStorageSync('userInfo', res.data.data);
             }

            wx.showToast({
              title: '注册成功',
              icon: 'success'
            });

            // 注册成功后，跳转到首页或其他页面
            // 如果希望用户注册后立即可以操作，跳转到首页是合理的
            // 如果希望引导用户完善信息，可以跳转到信息完善页
            wx.switchTab({
              url: '/pages/index/index', // 跳转到首页 (tabBar 页面)
              success: () => {
                console.log('跳转到首页成功');
              },
              fail: (err) => {
                console.error('跳转失败:', err);
                // 如果跳转失败，可能需要提示用户手动前往
              }
            });
          } else {
            // 处理注册失败 (res.data.success === false)
            // 例如：邮箱已被占用、手机号已被占用、服务器错误等
            const errMsg = res.data?.error || '注册失败，请稍后重试';
            wx.showToast({
              title: errMsg,
              icon: 'none'
            });
          }
        } else {
          // 处理 HTTP 错误状态码
          // 例如：400 Bad Request, 500 Internal Server Error
          const errMsg = res.data?.error || `注册失败 (${res.statusCode})`;
          wx.showToast({
            title: errMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误，请检查连接',
          icon: 'none'
        });
      }
    });
  }
});