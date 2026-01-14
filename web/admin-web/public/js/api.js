// public/admin/js/api.js
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 通用的 API 请求函数
 * @param {string} path - API 路径，例如 '/admin/orders'
 * @param {Object} options - fetch 的 options 对象，例如 { method: 'POST', body: {...} }
 * @returns {Promise<any>} - 解析后的响应数据 (JSON 或 text)
 */
async function apiRequest(path, options = {}) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        throw new Error('未找到管理员Token，请重新登录');
    }

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
        ...options,
    };

    // 对于非 GET 请求，需要处理 body
    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    } else if (typeof options.body === 'string') {
        config.body = options.body;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            // Token 过期或无效，清除本地存储并跳转到登录页
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
            return; // 不会执行到下面，但为了安全
        }
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