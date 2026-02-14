// public/admin/js/login.js
// 引入 api.js 是必要的，因为我们会用到其中的 API_BASE_URL
// 但是我们不直接用 apiRequest，因为登录本身不需要 token

/**
 * 一个用于无需认证的 API 请求的辅助函数 (例如登录)
 * @param {string} path - API 路径，例如 '/admin/login'
 * @param {Object} options - fetch 的 options 对象，例如 { method: 'POST', body: {...} }
 * @returns {Promise<any>} - 解析后的响应数据 (JSON 或 text)
 */
async function apiRequestWithoutAuth(path, options = {}) {
    // 注意：这里没有从 localStorage 获取 adminToken，也不添加 Authorization 头
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers, // 允许外部传入额外的 headers
        },
        ...options,
    };

    // 对于非 GET 请求，处理 body
    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    } else if (typeof options.body === 'string') {
        config.body = options.body;
    }

    // 使用 api.js 中定义的基础 URL
    const response = await fetch(`${API_BASE_URL}${path}`, config);

    if (!response.ok) {
        // 尝试从响应中获取更详细的错误信息
        let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.error || errorData.message) {
                errorMessage = errorData.message || errorData.error || errorMessage;
            }
        } catch (e) {
            // 如果无法解析 JSON，保留原始错误信息
        }
        throw new Error(errorMessage);
    }

    // 对于没有返回体的请求（如 204 No Content）
    if (response.status === 204) {
        return null;
    }

    // 对于其他成功请求，尝试返回 JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    } else {
        // 如果不是 JSON，返回文本
        return await response.text();
    }
}


// 获取页面元素
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

/**
 * 登录函数
 * @param {Event} event - 表单提交事件
 */
async function login(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 使用新的、无需认证的 API 请求函数
        const response = await apiRequestWithoutAuth('/admin/login', {
            method: 'POST',
            body: { username, password } // 使用对象，apiRequestWithoutAuth 会自动转换为 JSON
        });

        // 检查响应格式，根据后端实际返回的数据结构处理
        if (response.success && response.data && response.data.token) {
            // 登录成功，保存 token
            localStorage.setItem('adminToken', response.data.token);
            // 可以显示成功消息（可选）
            loginMessage.textContent = '登录成功！正在跳转...';
            loginMessage.className = 'success'; // 假设你有 .success CSS 类
            // 跳转到主页面
            window.location.href = '/index.html';
        } else if (response.token) {
            // 兼容另一种可能的响应格式
            localStorage.setItem('adminToken', response.token);
            loginMessage.textContent = '登录成功！正在跳转...';
            loginMessage.className = 'success';
            window.location.href = '/index.html';
        } else {
            // 如果后端返回了错误信息，但状态码是 2xx，可以根据实际 API 调整
            // 通常登录失败 status code 会是 4xx，上面的 !response.ok 会捕获
            throw new Error(response.message || response.error || '登录失败，未知错误');
        }
    } catch (error) {
        console.error('登录错误:', error);
        loginMessage.textContent = error.message;
        loginMessage.className = 'error'; // 假设你有 .error CSS 类
    }
}

// 页面加载完成后，为登录表单添加提交事件监听器
document.addEventListener('DOMContentLoaded', () => {
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});

// --- 旧的 login.js 内容 ---
/*
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`登录失败: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin/index.html'; // 登录成功后跳转
        } else {
            throw new Error('登录响应中未包含 Token');
        }
    } catch (error) {
        console.error('登录错误:', error);
        document.getElementById('loginMessage').textContent = error.message;
        document.getElementById('loginMessage').className = 'error';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', login);
});
*/
// --- 旧的 login.js 内容 ---