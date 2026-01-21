// main.js - 基于原始文件的最小修复版（保留全部功能）
document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://localhost:3000'; // 保留原始开发配置

    let currentTenantId = null;

    // ========== 初始化租户信息 ==========
    try {
        const res = await fetch(`${API_BASE}/api/tenant-web/profile`, {
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            currentTenantId = data.data.id;
            const tenantName = data.data.company_name || '我的租户';
            
            // ✅ 保留原始租户名称显示逻辑
            document.querySelectorAll('#tenant-name-display, #tenant-name-welcome').forEach(el => {
                el.textContent = tenantName;
            });
            
            loadProfileInfo(data.data);
        } else {
            alert('请先登录');
            window.location.href = '/apply.html';
        }
    } catch (error) {
        console.error('初始化失败:', error);
        alert('系统异常，请重试');
        window.location.href = '/apply.html';
    }

    // ========== 主 Tab 切换 ==========
    function showMainTab(tabName) {
        document.querySelectorAll('.main-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelectorAll('.main-tab-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(tabName)?.style.display = 'block';
        event?.target?.classList.add('active');
        
        // 自动加载订单 Tab 的默认子 Tab
        if (tabName === 'orders-tab') {
            showSubTab('pending');
        }
    }

    // ========== 订单子 Tab 切换 ==========
    function showSubTab(subTabName) {
        document.querySelectorAll('.sub-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelectorAll('.sub-tab-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(subTabName + '-orders')?.style.display = 'block';
        document.querySelector(`.sub-tab-link[data-subtab="${subTabName}"]`)?.classList.add('active');
        
        // 加载对应订单
        if (['pending', 'claimed', 'delivered', 'settling'].includes(subTabName)) {
            const status = subTabName === 'settling' ? 'delivered' : subTabName;
            loadOrders(status);
        }
    }

    // ========== 绑定导航事件 ==========
    document.querySelectorAll('.main-tab-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showMainTab(e.target.dataset.tab);
        });
    });

    document.querySelectorAll('.sub-tab-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSubTab(e.target.dataset.subtab);
        });
    });

    // ========== 资料加载与表单绑定 ==========
    function loadProfileInfo(tenant) {
        document.getElementById('company_name').value = tenant.company_name || '';
        document.getElementById('admin_name').value = tenant.contact_person || '';
        document.getElementById('admin_phone').value = tenant.contact_phone || '';
        document.getElementById('address').value = tenant.address || '';
    }

    function bindProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                company_name: formData.get('company_name'),
                contact_person: formData.get('admin_name'),
                contact_phone: formData.get('admin_phone'),
                address: formData.get('address')
            };

            try {
                const res = await fetch(`${API_BASE}/api/tenant-web/profile`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('资料保存成功');
                } else {
                    const err = await res.json();
                    alert(`保存失败: ${err.error || '未知错误'}`);
                }
            } catch (error) {
                alert('网络错误，请重试');
            }
        });
    }

    // ========== 新建订单绑定 ==========
    function bindNewOrderForm() {
        const form = document.getElementById('newOrderForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                customer_name: formData.get('customer_name'),
                customer_phone: formData.get('customer_phone'),
                address: formData.get('address'),
                weight_kg: parseFloat(formData.get('weight')) || 0
            };

            try {
                const res = await fetch(`${API_BASE}/api/tenant-web/orders`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('订单创建成功');
                    form.reset();
                    loadOrders('pending');
                } else {
                    const err = await res.json();
                    alert(`创建失败: ${err.error || '未知错误'}`);
                }
            } catch (error) {
                alert('网络错误，请重试');
            }
        });
    }

    // ========== 订单操作 ==========
    async function updateOrderStatus(orderId, action) {
        const endpoint = action === 'claim'
            ? `${API_BASE}/api/carrier/orders/${orderId}/claim`
            : `${API_BASE}/api/carrier/orders/${orderId}/complete`;

        try {
            const res = await fetch(endpoint, {
                method: 'PUT',
                credentials: 'include'
            });

            if (res.ok) {
                alert(action === 'claim' ? '订单认领成功' : '订单完成成功');
                // 重新加载相关 Tab
                if (action === 'claim') {
                    loadOrders('pending');
                    loadOrders('claimed');
                } else {
                    loadOrders('claimed');
                    loadOrders('delivered');
                }
            } else {
                const err = await res.json();
                alert(`操作失败: ${err.error || '未知错误'}`);
            }
        } catch (error) {
            alert('网络错误，请重试');
        }
    }

    // ========== 订单渲染辅助 ==========
    function getStatusText(order) {
        if (order.displayType === 'pending_unclaimed') return '待认领';
        const map = {
            pending_claim: '可认领订单',
            claimed: '运输中',
            delivered: '已送达',
            settled: '已结算'
        };
        return map[order.status] || order.status;
    }

    // ========== 渲染订单列表 ==========
    function renderOrderList(orders, status) {
        const containerMap = {
            pending: 'pending-orders-list',
            claimed: 'in-progress-orders-list',
            delivered: status === 'settling' ? 'settling-orders-list' : 'history-orders-list'
        };
        const containerId = containerMap[status] || 'pending-orders-list';
        const container = document.getElementById(containerId);
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p>暂无订单</p>';
            return;
        }

        const html = orders.map(order => {
            // ✅ 关键修复：兼容两种数据结构
            const customerName = order.customer_name || order.receiver_info?.name || '未知客户';
            const phone = order.customer_phone || order.receiver_info?.phone || '';
            const address = order.address || order.receiver_info?.address || '';
            const weight = order.weight || order.parcel_info?.weight_kg || 0;
            const trackingNumber = order.order_number || order.tracking_number || 'N/A';

            let actionBtn = '';
            if (order.displayType === 'pending_unclaimed') {
                actionBtn = `<button class="btn-claim" data-id="${order.id}">认领订单</button>`;
            } else if (order.status === 'claimed') {
                actionBtn = `<button class="btn-complete" data-id="${order.id}">完成订单</button>`;
            } else {
                actionBtn = '<span>已完成</span>';
            }

            return `
                <div class="order-item">
                    <p><strong>运单号:</strong> ${trackingNumber}</p>
                    <p><strong>客户:</strong> ${customerName}</p>
                    <p><strong>电话:</strong> ${phone}</p>
                    <p><strong>地址:</strong> ${address}</p>
                    <p><strong>重量:</strong> ${weight} kg</p>
                    <p><strong>状态:</strong> ${getStatusText(order)}</p>
                    <p>${actionBtn}</p>
                </div>
                <hr />
            `;
        }).join('');

        container.innerHTML = html;

        // 绑定事件
        container.querySelectorAll('.btn-claim').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                updateOrderStatus(id, 'claim');
            });
        });
        container.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                updateOrderStatus(id, 'complete');
            });
        });
    }

    // ========== 加载订单（核心修复） ==========
    async function loadOrders(status) {
      console.log('🔍 [TRACE] loadOrders called | status:', status, 
              '| stack:', new Error().stack.split('\n')[2].trim());
        const containerMap = {
            pending: 'pending-orders-list',
            claimed: 'in-progress-orders-list',
            delivered: status === 'settling' ? 'settling-orders-list' : 'history-orders-list'
        };
        const containerId = containerMap[status] || 'pending-orders-list';
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p>加载中...</p>'; // 显示 loading

        try {
            let allOrders = [];

            // 1. 加载已认领/进行中的订单（租户通用接口）
            const ownRes = await fetch(`${API_BASE}/api/tenant-web/orders?status=${status}`, {
                credentials: 'include'
            });

            if (ownRes.ok) {
                const ownData = await ownRes.json();
                (ownData.orders || []).forEach(order => {
                    order.displayType = 'claimed';
                });
                allOrders.push(...(ownData.orders || []));
            }

            // 2. 【关键修复】仅当 status= pending 时，加载待认领订单（承运商接口）
            if (status === 'pending') {
                const pendingRes = await fetch(`${API_BASE}/api/carrier/orders`, {
                    credentials: 'include'
                });

                if (pendingRes.ok) {
                    const pendingData = await pendingRes.json();
                    (pendingData.orders || []).forEach(order => {
                        order.displayType = 'pending_unclaimed';
                        // 字段标准化（适配 renderOrderList）
                        order.customer_name = order.receiver_info?.name || '未知客户';
                        order.customer_phone = order.receiver_info?.phone || '';
                        order.address = order.receiver_info?.address || '';
                        order.weight = order.parcel_info?.weight_kg || 0;
                    });
                    allOrders = [...(pendingData.orders || []), ...allOrders];
                }
            }

            renderOrderList(allOrders, status);

        } catch (error) {
            console.error('加载订单失败:', error);
            container.innerHTML = `<p>加载失败: ${error.message || '请重试'}</p>`; // ✅ 停止 loading
        }
    }

    // ========== 初始加载 ==========
    bindProfileForm();
    bindNewOrderForm();

    // 默认显示 dashboard
    showMainTab('dashboard-tab');

    // ========== 登出 ==========
    document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE}/api/tenant-web/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/apply.html';
        } catch (error) {
            console.error('登出失败:', error);
        }
    });
});