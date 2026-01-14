// public/admin/js/login.js
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // 简单的前端验证
            if (!username || !password) {
                messageDiv.textContent = '用户名和密码不能为空';
                messageDiv.className = 'error';
                return;
            }

            try {
                // 直接使用 fetch 进行登录，因为此时还没有 token
                const response = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    // 注意：后端现在返回的是 token，而非 set-cookie
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/admin/index.html'; // 跳转到主页面
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    messageDiv.textContent = errorData.message || errorData.error || '登录失败';
                    messageDiv.className = 'error';
                }
            } catch (error) {
                console.error('登录请求失败:', error);
                messageDiv.textContent = '网络错误，请稍后重试';
                messageDiv.className = 'error';
            }
        });
    }
});