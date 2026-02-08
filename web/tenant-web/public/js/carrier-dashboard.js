// carrier-dashboard.js - 承运商控制台专用JS
document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'http://localhost:3000';

  // 检查登录状态
  function checkLoginStatus() {
    const token = localStorage.getItem('tenantToken');
    if (!token) {
      window.location.href = './login.html';
      return false;
    }
    return true;
  }

  // 退出登录
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tenantToken');
      await fetch(`${API_BASE}/api/tenant-web/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      localStorage.removeItem('tenantToken');
      window.location.href = './login.html';
    } catch (error) {
      console.error('登出失败:', error);
      localStorage.removeItem('tenantToken');
      window.location.href = './login.html';
    }
  });

  // 加载承运商数据
  async function loadCarrierData() {
    if (!checkLoginStatus()) return;

    try {
      const token = localStorage.getItem('tenantToken');
      
      // 获取用户资料
      const profileResponse = await fetch(`${API_BASE}/api/tenant-web/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.data) {
          document.getElementById('welcome-message').textContent = `欢迎，${profileData.data.name || profileData.data.username || '承运商'}`;
        }
      }

      // 获取订单统计
      const ordersResponse = await fetch(`${API_BASE}/api/carrier/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success && ordersData.data) {
          // 统计数据
          const orders = ordersData.data.orders || [];
          document.getElementById('totalOrders').textContent = orders.length;

          // 按状态分类
          const pending = orders.filter(o => o.status === 'pending_claim').length;
          const inTransit = orders.filter(o => o.status === 'in_transit').length;
          const completed = orders.filter(o => o.status === 'delivered').length;

          document.getElementById('pendingOrders').textContent = pending;
          document.getElementById('inTransitOrders').textContent = inTransit;
          document.getElementById('completedOrders').textContent = completed;

          // 填充订单表格
          const ordersTableBody = document.getElementById('ordersTableBody');
          ordersTableBody.innerHTML = '';
          orders.slice(0, 10).forEach(order => {
            const row = document.createElement('tr');
            const statusClass = `status-${(order.status || '').replace(/_/g, '-')}`;
            const statusText = getStatusText(order.status);

            // 解析发货和收货信息
            let pickupAddr = 'N/A';
            let deliveryAddr = 'N/A';
            let weight = order.weight_kg || 'N/A';
            let pickupPhone = order.customer_phone || 'N/A';
            let deliveryPhone = 'N/A';

            try {
              // 解析发货信息
              const senderInfo = typeof order.sender_info === 'string'
                ? JSON.parse(order.sender_info)
                : order.sender_info || {};
              pickupAddr = senderInfo.address || senderInfo.full_address || senderInfo.pickup_address || 'N/A';
              pickupPhone = senderInfo.phone || senderInfo.contact_phone || order.customer_phone || 'N/A';

              // 解析收货信息
              const receiverInfo = typeof order.receiver_info === 'string'
                ? JSON.parse(order.receiver_info)
                : order.receiver_info || {};
              deliveryAddr = receiverInfo.address || receiverInfo.full_address || receiverInfo.delivery_address || 'N/A';
              deliveryPhone = receiverInfo.phone || receiverInfo.contact_phone || receiverInfo.receiver_phone || 'N/A';
            } catch (e) {
              console.warn('解析订单信息失败:', e.message);
              pickupAddr = '解析失败';
              deliveryAddr = '解析失败';
              pickupPhone = '解析失败';
              deliveryPhone = '解析失败';
            }

            row.innerHTML = `
              <td>${order.tracking_number || order.id}</td>
              <td>${pickupAddr}</td>
              <td>${deliveryAddr}</td>
              <td>${weight} kg</td>
              <td>${pickupPhone}</td>
              <td>${deliveryPhone}</td>
              <td><span class="status-badge ${statusClass}">${statusText}</span></td>
              <td>
                <button class="btn btn-primary" onclick="viewOrder('${order.id}')">查看</button>
                ${(order.status || '') === 'pending_claim' ? `<button class="btn btn-success" onclick="handleClaimOrder('${order.id}')">认领</button>` : ''}
              </td>
            `;
            document.getElementById('ordersTableBody').appendChild(row);
          });
        }
      }

      // 获取报价数据
      const quotesResponse = await fetch(`${API_BASE}/api/carrier/quotes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        if (quotesData.success && quotesData.data) {
          const quotesTableBody = document.getElementById('quotesTableBody');
          quotesTableBody.innerHTML = '';
          (quotesData.data.quotes || []).forEach(quote => {
            const row = document.createElement('tr');
            const statusClass = `status-${(quote.status || '').replace(/_/g, '-')}`;
            const statusText = getQuoteStatusText(quote.status);

            row.innerHTML = `
              <td>${quote.order_id || 'N/A'}</td>
              <td>¥${quote.price || '0.00'}</td>
              <td>${quote.estimated_hours ? quote.estimated_hours + '小时' : 'N/A'}</td>
              <td><span class="status-badge ${statusClass}">${statusText}</span></td>
              <td>${new Date(quote.created_at).toLocaleDateString() || 'N/A'}</td>
            `;
            document.getElementById('quotesTableBody').appendChild(row);
          });
        }
      }

      // 获取车辆数据
      const vehiclesResponse = await fetch(`${API_BASE}/api/admin/tenants/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        if (vehiclesData.success && vehiclesData.data) {
          const vehiclesTableBody = document.getElementById('vehiclesTableBody');
          vehiclesTableBody.innerHTML = '';
          (vehiclesData.data.vehicles || []).forEach(vehicle => {
            const row = document.createElement('tr');
            const statusClass = `status-${(vehicle.status || '').replace(/_/g, '-')}`;
            const statusText = getVehicleStatusText(vehicle.status);

            row.innerHTML = `
              <td>${vehicle.plate_number || 'N/A'}</td>
              <td>${vehicle.type || 'N/A'}</td>
              <td>${vehicle.max_weight || 'N/A'}</td>
              <td><span class="status-badge ${statusClass}">${statusText}</span></td>
              <td>
                <button class="btn btn-primary" onclick="editVehicle('${vehicle.id}')">编辑</button>
                <button class="btn btn-danger" onclick="deleteVehicle('${vehicle.id}')">删除</button>
              </td>
            `;
            document.getElementById('vehiclesTableBody').appendChild(row);
          });
        }
      }
    } catch (error) {
      console.error('加载承运商数据时出错:', error);
    }
  }

  // 获取状态文本
  function getStatusText(status) {
    const statusMap = {
      'created': '已创建',
      'pending_claim': '待认领',
      'claimed': '已认领',
      'quoted': '已报价',
      'awarded': '已中标',
      'dispatched': '已发货',
      'in_transit': '运输中',
      'delivered': '已送达',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  // 获取报价状态文本
  function getQuoteStatusText(status) {
    const statusMap = {
      'pending': '待确认',
      'accepted': '已接受',
      'rejected': '已拒绝',
      'expired': '已过期'
    };
    return statusMap[status] || status;
  }

  // 获取车辆状态文本
  function getVehicleStatusText(status) {
    const statusMap = {
      'active': '运营中',
      'inactive': '停运中',
      'maintenance': '维修中',
      'out_of_service': '报废'
    };
    return statusMap[status] || status;
  }

  // 页面加载时检查登录状态并加载数据
  if (checkLoginStatus()) {
    loadCarrierData();
  }
  
  // 认领订单函数
  window.handleClaimOrder = async function(orderId) {
    if (!confirm(`确定要认领订单 ${orderId} 吗？`)) return;
    
    try {
      const token = localStorage.getItem('tenantToken');
      const response = await fetch(`${API_BASE}/api/carrier/orders/${orderId}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('订单认领成功！');
        loadCarrierData(); // 重新加载数据
      } else {
        const errorData = await response.json();
        alert(`认领失败: ${errorData.message || errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('认领订单时出错:', error);
      alert('认领订单时出错，请稍后重试');
    }
  };
  
  // 查看订单函数
  window.viewOrder = function(orderId) {
    alert(`查看订单 ${orderId} 详情`);
    // 这里可以实现跳转到订单详情页的逻辑
  };
  
  // 编辑车辆函数
  window.editVehicle = function(vehicleId) {
    alert(`编辑车辆 ${vehicleId}`);
  };
  
  // 删除车辆函数
  window.deleteVehicle = async function(vehicleId) {
    if (!confirm(`确定要删除车辆 ${vehicleId} 吗？`)) return;
    
    try {
      const token = localStorage.getItem('tenantToken');
      const response = await fetch(`${API_BASE}/api/admin/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('车辆删除成功！');
        loadCarrierData(); // 重新加载数据
      } else {
        const errorData = await response.json();
        alert(`删除失败: ${errorData.message || errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除车辆时出错:', error);
      alert('删除车辆时出错，请稍后重试');
    }
  };
});