// web/tenant-web/public/js/carrier-login.js
// 承运商登录页面脚本

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('carrierLoginForm');
  const messageDiv = document.getElementById('message');
  const loginButton = document.getElementById('loginButton');

  function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.className = isError ? 'message error' : 'message success';
    messageDiv.style.display = 'block';

    // 3 秒后自动隐藏
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }

  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // 前端验证
    if (!email || !password) {
      showMessage('邮箱和密码不能为空', true);
      return;
    }

    // 简单邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('请输入有效的邮箱地址', true);
      return;
    }

    try {
      // 显示加载状态
      loginButton.textContent = '登录中...';
      loginButton.disabled = true;

      // 发送登录请求到租户登录 API（承运商使用同一端点）
      console.log('正在发送登录请求到 /api/tenant-web/login');
      const response = await fetch('/api/tenant-web/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      console.log('收到响应:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('登录响应数据:', data);

        // 检查响应格式并存储 token
        let token = null;
        if (data && data.data && data.data.token) {
          // 新格式：token 在 data.token 下
          token = data.data.token;
        } else if (data && data.token) {
          // 旧格式：token 直接在顶层
          token = data.token;
        }

        if (token) {
          localStorage.setItem('tenantToken', token);
          localStorage.setItem('userRole', 'carrier'); // 设置用户角色为承运商
          console.log('Token 已保存:', token.substring(0, 20) + '...');

          showMessage('登录成功！正在跳转...', false);

          // 跳转到承运商控制台
          setTimeout(() => {
            console.log('执行跳转到 /carrier-dashboard.html');
            window.location.href = '/carrier-dashboard.html';
          }, 1000);
        } else {
          console.error('登录响应中未包含有效 token:', data);
          throw new Error('登录响应中未包含有效 token');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('登录失败响应:', errorData);
        let errorMessage = errorData.message || errorData.error || `登录失败 (${response.status})`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('登录错误:', error);
      showMessage(error.message || '登录失败，请稍后重试', true);
    } finally {
      // 恢复按钮状态
      loginButton.textContent = '登录';
      loginButton.disabled = false;
    }
  });
});
