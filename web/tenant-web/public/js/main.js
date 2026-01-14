// pc-tenant/main.js

// ========== 配置区 ==========
const API_BASE = 'http://localhost:3000'; // 开发环境
// const API_BASE = 'https://api.yourdomain.com'; // 生产环境（上线时取消注释）
// ===========================

let currentTenantId = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const profileResponse = await fetch(`${API_BASE}/api/tenant-web/profile`, { credentials: 'include' });
    if (!profileResponse.ok) {
      window.location.href = '/pc-tenant/apply.html';
      return;
    }
    const profile = await profileResponse.json();
    currentTenantId = profile.id;

    document.querySelectorAll('#tenant-name-display, #tenant-name-welcome').forEach(el => {
      el.textContent = profile.name || '租户';
    });

    await loadProfileInfo();
    showMainTab('dashboard');

    bindNavigationEvents();
    bindProfileForm();
    bindNewOrderForm();
  } catch (error) {
    console.error('初始化失败:', error);
    alert('系统初始化失败，请重试或重新登录。');
    window.location.href = '/pc-tenant/apply.html';
  }
});

// ========== 导航切换 ==========
function bindNavigationEvents() {
  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      showMainTab(tabId);
    });
  });

  document.querySelectorAll('.sub-tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const subTabId = link.getAttribute('data-subtab');
      showSubTab(subTabId);
    });
  });

  document.querySelectorAll('.msg-tab').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const msgTab = link.getAttribute('data-msgtab');
      showMsgTab(msgTab);
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
}

function showMainTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');

  document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));
  document.querySelector(`.tab-link[data-tab="${tabId}"]`)?.classList.add('active');

  if (tabId === 'orders') {
    showSubTab('pending');
  } else if (tabId === 'profile') {
    loadProfileInfo();
  }
}

function showSubTab(subTabId) {
  const mapping = { pending: 'pending-orders', 'in-progress': 'in-progress-orders', settling: 'settling-orders', history: 'history-orders' };
  const targetId = mapping[subTabId] || 'pending-orders';

  document.querySelectorAll('.sub-tab-content').forEach(el => el.style.display = 'none');
  document.getElementById(targetId).style.display = 'block';

  document.querySelectorAll('.sub-tab-link').forEach(el => el.classList.remove('active'));
  document.querySelector(`.sub-tab-link[data-subtab="${subTabId}"]`)?.classList.add('active');

  if (subTabId === 'pending') {
    loadOrders('pending');
  } else if (subTabId === 'in-progress') {
    loadOrders('claimed');
  } else if (subTabId === 'settling' || subTabId === 'history') {
    loadOrders('delivered');
  }
}

function showMsgTab(msgTab) {
  const mapping = { 'new-orders': 'new-orders-msg', completed: 'completed-msg', chat: 'chat-msg' };
  const targetId = mapping[msgTab] || 'new-orders-msg';

  document.querySelectorAll('.msg-content').forEach(el => el.style.display = 'none');
  document.getElementById(targetId).style.display = 'block';

  document.querySelectorAll('.msg-tab').forEach(el => el.classList.remove('active'));
  document.querySelector(`.msg-tab[data-msgtab="${msgTab}"]`)?.classList.add('active');
}

// ========== 租户信息 ==========
async function loadProfileInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/tenant-web/profile`, { credentials: 'include' });
    if (!res.ok) throw new Error('获取租户信息失败');
    const data = await res.json();

    document.getElementById('company_name').value = data.name || '';
    document.getElementById('admin_name').value = data.contact_person || '';
    document.getElementById('contact_phone').value = data.contact_phone || '';
    document.getElementById('address_info').value = data.address || '';
    document.getElementById('license_no').value = data.business_license || '';
    document.getElementById('join_date').value = data.created_at ? new Date(data.created_at).toLocaleString() : '';
  } catch (err) {
    console.error(err);
    alert('加载租户信息失败');
  }
}

function bindProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updateData = {
      contact_person: form.admin_name.value || '',
      contact_phone: form.contact_phone.value || '',
      address: form.address_info.value || ''
    };

    try {
      const res = await fetch(`${API_BASE}/api/tenant-web/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (res.ok) {
        alert('信息更新成功！');
        loadProfileInfo();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('更新失败: ' + (err.message || '未知错误'));
      }
    } catch (error) {
      console.error(error);
      alert('网络错误，请重试');
    }
  });
}

// ========== 新建订单 ==========
function bindNewOrderForm() {
  const form = document.getElementById('newOrderForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer_name = form.customer_name.value.trim();
    const customer_phone = form.customer_phone.value.trim();
    const address = form.address.value.trim();
    const weight = parseFloat(form.weight.value);

    if (!customer_name || !customer_phone || !address || isNaN(weight) || weight <= 0) {
      alert('请填写完整且有效的订单信息');
      return;
    }

    const orderData = { customer_name, customer_phone, address, weight };

    try {
      const res = await fetch(`${API_BASE}/api/tenant-web/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        credentials: 'include'
      });

      if (res.ok) {
        alert('新订单创建成功！');
        form.reset();
        loadOrders('pending');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('创建失败: ' + (err.error || err.message || '未知错误'));
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      alert('网络错误，请检查连接后重试');
    }
  });
}

// ========== 订单管理 ==========
async function loadOrders(status) {
  try {
    let allOrders = [];

    const ownRes = await fetch(`${API_BASE}/api/tenant-web/orders?status=${status}`, { credentials: 'include' });
    if (ownRes.ok) {
      const ownOrders = await ownRes.json();
      ownOrders.forEach(order => order.displayType = 'claimed');
      allOrders = [...ownOrders];
    }

    if (status === 'pending') {
      const pendingRes = await fetch(`${API_BASE}/api/tenant-web/orders/pending`, { credentials: 'include' });
      if (pendingRes.ok) {
        const pendingOrders = await pendingRes.json();
        pendingOrders.forEach(order => order.displayType = 'pending_unclaimed');
        allOrders = [...pendingOrders, ...allOrders];
      }
    }

    renderOrderList(allOrders, status);
  } catch (error) {
    console.error('加载订单失败:', error);
    alert('加载订单失败，请重试');
  }
}

function renderOrderList(orders, status) {
  const containerId = {
    pending: 'pending-orders-list',
    claimed: 'in-progress-orders-list',
    delivered: status === 'settling' ? 'settling-orders-list' : 'history-orders-list'
  }[status] || 'pending-orders-list';

  const container = document.getElementById(containerId);
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<p>暂无订单</p>';
    return;
  }

  const html = orders.map(order => {
    let actionBtn = '';
    if (order.displayType === 'pending_unclaimed') {
      actionBtn = `<button class="btn-claim" data-id="${order.id}">认领订单</button>`;
    } else if (order.status === 'claimed') {
      actionBtn = `<button class="btn-complete" data-id="${order.id}">完成订单</button>`;
    } else if (order.status === 'delivered') {
      actionBtn = '<span>已完成</span>';
    }

    return `
      <div class="order-item">
        <p><strong>订单号:</strong> ${order.order_number}</p>
        <p><strong>客户:</strong> ${order.customer_name}</p>
        <p><strong>电话:</strong> ${order.customer_phone}</p>
        <p><strong>地址:</strong> ${order.address}</p>
        <p><strong>重量:</strong> ${order.weight} kg</p>
        <p><strong>状态:</strong> ${getStatusText(order)}</p>
        <p>${actionBtn}</p>
      </div>
      <hr />
    `;
  }).join('');

  container.innerHTML = html;

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

function getStatusText(order) {
  if (order.displayType === 'pending_unclaimed') return '待认领';
  if (order.status === 'claimed') return '进行中';
  if (order.status === 'delivered') return '已完成';
  return order.status;
}

async function updateOrderStatus(orderId, action) {
  const endpoint = action === 'claim' 
    ? `/api/tenant-web/orders/${orderId}/claim`
    : `/api/tenant-web/orders/${orderId}/complete`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (res.ok) {
      alert(action === 'claim' ? '订单认领成功！' : '订单已完成！');
      loadOrders('pending');
    } else {
      const err = await res.json().catch(() => ({}));
      alert('操作失败: ' + (err.error || err.message || '未知错误'));
    }
  } catch (error) {
    console.error('更新订单状态失败:', error);
    alert('网络错误，请重试');
  }
}

// ========== 登出 ==========
async function handleLogout(e) {
  e.preventDefault();
  try {
    await fetch(`${API_BASE}/api/tenant-web/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.warn('登出请求失败，但仍清除本地状态');
  }
  window.location.href = '/pc-tenant/apply.html';
}