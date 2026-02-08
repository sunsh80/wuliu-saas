// public/admin/js/auth.js
// 页面元素引用 (如果 index.html 或其他页面中有这些元素)
const loginSection = document.getElementById('loginSection');
const mainSection = document.getElementById('mainSection');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

/**
 * 检查本地存储中是否有有效的 Token
 */
function checkStoredToken() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // 如果有 Token，显示主界面
        showMainSection();
    } else {
        // 没有 Token，显示登录界面
        showLoginSection();
    }
}

/**
 * 显示登录界面
 */
function showLoginSection() {
    if(loginSection) loginSection.classList.remove('hidden');
    if(mainSection) mainSection.classList.add('hidden');
}

/**
 * 显示主界面
 */
function showMainSection() {
    if(loginSection) loginSection.classList.add('hidden');
    if(mainSection) mainSection.classList.remove('hidden');
}

/**
 * 登出函数
 */
function logout() {
    // 清除本地存储的 Token
    localStorage.removeItem('adminToken');
    // 显示登录界面
    showLoginSection();
    // 可选：跳转到登录页
    // window.location.href = '/admin/login.html';
}

/**
 * 获取当前存储的 Token
 * @returns {string|null}
 */
function getStoredToken() {
    return localStorage.getItem('adminToken');
}

/**
 * 显示消息的辅助函数
 * @param {string} text - 要显示的消息
 * @param {boolean} isError - 是否为错误消息
 */
function showMessage(text, isError = false) {
    const msgDiv = document.getElementById('message');
    if(msgDiv) {
        msgDiv.textContent = text;
        msgDiv.className = isError ? 'error' : 'success';
    } else {
        // 如果页面没有 #message 元素，则使用 alert
        alert(text);
    }
}

/**
 * 登录函数
 * @param {Event} event - 表单提交事件
 */
async function login(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 使用相对路径确保通过代理
        const response = await fetch('/api/admin/login', {
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
            // 后端返回 token
            localStorage.setItem('adminToken', data.token);
            showMessage('登录成功！', false);
            loginMessage.textContent = '';
            loginMessage.className = ''; // 清空消息样式
            showMainSection();
        } else {
            throw new Error('登录响应中未包含 Token');
        }
    } catch (error) {
        console.error('登录错误:', error);
        loginMessage.textContent = error.message;
        loginMessage.className = 'error';
    }
}

// 页面加载完成后，检查 Token
document.addEventListener('DOMContentLoaded', () => {
    checkStoredToken();

    // 为登出按钮添加事件监听器 (假设有登出按钮)
    const logoutButton = document.getElementById('logoutButton');
    if(logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // 为登录表单添加提交事件监听器 (如果存在于当前页面)
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});