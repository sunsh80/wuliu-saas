// 数据库API中间件 - 用于前端调用的数据库接口
// 注意：在实际生产环境中，这些接口应该在后端服务器上实现，而不是前端直接访问数据库

// 以下是前端可以使用的数据库API接口定义
// 实际实现应该在后端服务器上

const dbAPI = {
    // 获取订单统计信息
    async getOrderStats() {
        try {
            // 这里应该调用后端API，而不是直接访问数据库
            const response = await fetch('/api/admin/dashboard/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取订单统计失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('获取订单统计信息失败:', error);
            throw error;
        }
    },

    // 获取订单列表
    async getOrders(page = 1, limit = 10) {
        try {
            const response = await fetch(`/api/admin/orders?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取订单列表失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('获取订单列表失败:', error);
            throw error;
        }
    },

    // 获取租户列表
    async getTenants(page = 1, limit = 10) {
        try {
            const response = await fetch(`/api/admin/tenants?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取租户列表失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('获取租户列表失败:', error);
            throw error;
        }
    },

    // 获取待审核租户
    async getPendingTenants() {
        try {
            const response = await fetch('/api/admin/tenants/pending', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取待审核租户失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('获取待审核租户失败:', error);
            throw error;
        }
    },

    // 更新订单状态
    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error(`更新订单状态失败: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('更新订单状态失败:', error);
            throw error;
        }
    },

    // 批准租户申请
    async approveTenant(tenantId, roles = ["customer", "carrier"]) {
        try {
            const response = await fetch(`/api/admin/tenants/${tenantId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roles })
            });
            
            if (!response.ok) {
                throw new Error(`批准租户申请失败: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('批准租户申请失败:', error);
            throw error;
        }
    },

    // 拒绝租户申请
    async rejectTenant(tenantId, notes = "") {
        try {
            const response = await fetch(`/api/admin/tenants/${tenantId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes })
            });
            
            if (!response.ok) {
                throw new Error(`拒绝租户申请失败: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('拒绝租户申请失败:', error);
            throw error;
        }
    }
};

// 导出数据库API接口
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dbAPI;
}

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
    window.dbAPI = dbAPI;
}