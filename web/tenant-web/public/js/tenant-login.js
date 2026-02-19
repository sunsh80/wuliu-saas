document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');

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

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // 简单的前端验证
    if (!username || !password) {
      showMessage('用户名和密码不能为空', true);
      return;
    }

    try {
      // 显示加载状态
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '登录中...';
      submitBtn.disabled = true;

      // 发送登录请求到租户登录 API
      console.log('正在发送登录请求到 /api/tenant-web/login');
      // 根据输入判断是邮箱还是手机号
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      const loginData = isEmail ? { email: username, password } : { phone: username, password };

      const response = await fetch('/api/tenant-web/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      console.log('收到响应:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('登录响应数据:', data);

        // 存储 token
        if (data && data.data && data.data.token) {
          localStorage.setItem('tenantToken', data.data.token);
          localStorage.setItem('userRole', 'tenant');
          console.log('Token 已保存:', data.data.token.substring(0, 20) + '...');

          // 跳转到承运商控制台
          setTimeout(() => {
            console.log('登录成功，跳转到 /carrier-dashboard.html');
            window.location.href = '/carrier-dashboard.html';
          }, 1000);
        } else if (data && data.success === true) {
          // 如果没有返回 token 但登录成功，也允许继续（使用会话认证）
          console.log('登录成功（使用会话认证）');
          localStorage.setItem('userRole', 'tenant');
          showMessage('登录成功！正在跳转...', false);

          // 跳转到承运商控制台
          setTimeout(() => {
            console.log('登录成功，跳转到 /carrier-dashboard.html');
            window.location.href = '/carrier-dashboard.html';
          }, 1000);
        } else {
          console.error('登录响应中未包含有效 token:', data);
          throw new Error('登录响应中未包含有效 token');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('登录失败响应:', errorData);
        throw new Error(errorData.message || errorData.error || `登录失败 (${response.status})`);
      }
    } catch (error) {
      console.error('登录错误:', error);
      showMessage(error.message || '登录失败，请稍后重试', true);
    } finally {
      // 恢复按钮状态
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.textContent = '登录';
      submitBtn.disabled = false;
    }
  });
});
