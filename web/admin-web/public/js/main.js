// main.js - 基础前端功能

// 检查登录状态的函数
function checkLoginStatus() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// 显示消息的函数
function showMessage(message, isError = false) {
    const msgDiv = document.getElementById('message') || document.getElementById('error-message') || document.getElementById('success-message');
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.style.display = 'block';
        msgDiv.className = isError ? 'error' : 'success';

        // 3秒后自动隐藏消息
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    } else {
        // 如果页面没有消息元素，则使用 alert
        alert(message);
    }
}

// 获取当前登录用户的 token
function getAuthToken() {
    return localStorage.getItem('adminToken');
}

// 从 api.js 导入 API_BASE_URL
// 注意：需要确保在使用此函数前，api.js 已经被加载
// 使用相对路径以通过代理

// 通用的 API 请求函数
async function apiRequest(path, options = {}) {
    const token = getAuthToken();

    // 使用相对路径确保通过代理
    const fullPath = path.startsWith('/api') ? path : `/api${path}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fullPath, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 请求错误:', error);
        throw error;
    }
}

// 退出登录函数
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login.html';
}

// 页面加载完成后执行的初始化函数（使用 load 事件确保所有资源已加载）
window.addEventListener('load', function() {
    console.log('[main.js] window.onload 触发');
    
    // 检查当前页面是否需要登录验证
    const protectedPages = ['/index.html', '/orders.html', '/customers.html', '/carriers.html', '/tenants.html', '/reports.html', '/application-list.html', '/pricing-rules.html', '/violations.html', '/commissions.html', '/settings.html', '/vehicle-models.html', '/vehicles.html', '/dashboard.html', '/finance.html', '/wallet-management.html', '/commission-management.html', '/settlement-management.html'];
    const currentPath = window.location.pathname;
    
    console.log('[main.js] 当前路径:', currentPath);
    console.log('[main.js] 检查登录状态...');

    if (protectedPages.includes(currentPath) && currentPath !== '/login.html') {
        const isLoggedIn = checkLoginStatus();
        console.log('[main.js] 登录状态:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('[main.js] 未登录，但继续执行以测试导航');
            // 不要立即重定向，让用户能看到导航
            // return; // 注释掉重定向
        }
    }

    // 为退出按钮添加事件监听器（如果存在）
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('[main.js] 绑定 logout 事件');
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // 初始化二级导航菜单
    console.log('[main.js] 调用 initSubmenu');
    initSubmenu();
});

// 初始化二级导航菜单
function initSubmenu() {
    // 查找所有包含二级菜单的导航项
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach((toggle, index) => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();

            const parentLi = this.closest('li');
            const submenu = parentLi.querySelector('.submenu');

            if (submenu) {
                // 切换当前菜单的展开状态
                parentLi.classList.toggle('open');
            }
        });

        // 添加点击样式反馈
        toggle.style.cursor = 'pointer';
    });

    // 如果当前页面在二级菜单中，自动展开父菜单
    const currentPath = window.location.pathname;
    const submenuLinks = document.querySelectorAll('.submenu a');

    submenuLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            const parentLi = link.closest('.has-submenu');
            if (parentLi) {
                parentLi.classList.add('open');
            }
        }
    });
}

// 通用的格式化日期函数
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 通用的确认对话框
function confirmAction(message, onConfirm) {
    if (confirm(message)) {
        onConfirm();
    }
}