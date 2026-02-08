// 数据库连接配置示例
// 注意：实际项目中，数据库连接应在后端实现，前端不应直接连接数据库

// 模拟数据库连接配置
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'admin_user',
    password: 'secure_password',
    database: 'logistics_db',
    connectionLimit: 10
};

// 模拟数据库连接函数
function connectToDatabase() {
    console.log('正在连接到数据库...');
    // 在实际项目中，这里会使用适当的数据库驱动程序
    // 如 mysql2, pg, mongodb 等
    console.log('数据库连接成功');
    return {
        query: (sql, params) => {
            // 模拟查询函数
            console.log(`执行SQL: ${sql}`);
            console.log(`参数: ${params}`);
            // 返回模拟数据
            return Promise.resolve([]);
        },
        close: () => {
            console.log('数据库连接已关闭');
        }
    };
}

// API 请求函数，用于与后端交互
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

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    } else if (typeof options.body === 'string') {
        config.body = options.body;
    }

    const response = await fetch(`/api${path}`, config);

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

// 数据库操作示例
const dbOperations = {
    // 获取所有订单
    getAllOrders: async () => {
        return await apiRequest('/admin/orders', { method: 'GET' });
    },

    // 获取特定订单
    getOrderById: async (orderId) => {
        return await apiRequest(`/admin/orders/${orderId}`, { method: 'GET' });
    },

    // 更新订单状态
    updateOrderStatus: async (orderId, status) => {
        return await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    // 获取所有租户
    getAllTenants: async () => {
        return await apiRequest('/admin/tenants', { method: 'GET' });
    },

    // 获取待审核租户
    getPendingTenants: async () => {
        return await apiRequest('/admin/tenants/pending', { method: 'GET' });
    },

    // 批准租户申请
    approveTenant: async (tenantId, roles) => {
        return await apiRequest(`/admin/tenants/${tenantId}/approve`, {
            method: 'PUT',
            body: { roles }
        });
    },

    // 拒绝租户申请
    rejectTenant: async (tenantId, notes) => {
        return await apiRequest(`/admin/tenants/${tenantId}/reject`, {
            method: 'PUT',
            body: { notes }
        });
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dbConfig, connectToDatabase, apiRequest, dbOperations };
}