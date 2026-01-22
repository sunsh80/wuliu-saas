// public/admin/js/orderManager.js
// 引入 apiRequest 和 showMessage (需要在 HTML 中先引入 api.js 和 auth.js)

/**
 * 加载所有订单 (修改以使用 apiRequest)
 */
async function loadAllOrders() {
    console.log('--- 开始加载订单 ---');
    // 添加一个加载锁，防止在加载过程中更新DOM
    if (window.isLoadingOrders) { // 使用全局变量或闭包管理状态
        console.log('加载已在进行中，跳过本次加载请求。');
        return; // 如果正在加载，则直接返回，避免并发加载
    }
    window.isLoadingOrders = true; // 设置加载锁为 true

    try {
        console.log('正在请求订单数据...');
        // 使用 apiRequest
        const response = await apiRequest('/admin/orders');
        // OpenAPI 定义的响应结构是 { data: [...] }
        const orders = response.data;

        if (!Array.isArray(orders)) {
            console.error('data 不是数组:', orders);
            showMessage('服务器返回的数据格式不正确', true);
            return;
        }
        console.log('数据是数组，长度:', orders.length);
        console.log('开始调用 displayOrders...');
        displayOrders(orders); // 调用函数显示数据
        console.log('完成调用 displayOrders...');
        showMessage(`成功加载 ${orders.length} 条订单`);
    } catch (error) {
        console.error('加载订单失败:', error);
        showMessage(`加载订单失败: ${error.message}`, true);
    } finally {
        // 无论成功失败，都清除加载锁
        window.isLoadingOrders = false;
    }
    console.log('--- 结束加载订单 ---');
}

/**
 * 显示订单数据到表格
 * @param {Array} orders - 订单数据数组
 */
function displayOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = ''; // 清空现有内容

    orders.forEach(order => {
        const row = tbody.insertRow(); // 创建新行
        // 设置一个数据属性，方便后续更新状态时定位
        row.setAttribute('data-order-id', order.id);

        // 填充单元格 (根据 index.html 的表头顺序)
        row.insertCell(0).textContent = order.id;
        row.insertCell(1).textContent = order.order_number || 'N/A';
        row.insertCell(2).textContent = order.customer_name || 'N/A';
        row.insertCell(3).textContent = order.customer_phone || 'N/A';
        row.insertCell(4).textContent = order.pickup_address || 'N/A';
        row.insertCell(5).textContent = order.weight_kg || 'N/A';
        row.insertCell(6).textContent = order.volume_m3 || 'N/A';
        row.insertCell(7).textContent = order.status || 'unknown';

        const createdAt = new Date(order.created_at).toLocaleString();
        row.insertCell(8).textContent = createdAt;

        // 创建状态单元格
        const statusCell = row.insertCell(9);
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        statusSelect.setAttribute('data-order-id', order.id); // 用 data 属性绑定订单 ID

        // 关键: 状态选项与后端 OpenAPI 定义完全一致
        const statusOptions = [
            { value: 'pending', label: '待审核' },
            { value: 'pending_claim', label: '待认领' },
            { value: 'available', label: '可认领' },
            { value: 'created', label: '已创建' },
            { value: 'claimed', label: '已认领' },
            { value: 'awarded', label: '已成交' },
            { value: 'dispatched', label: '已发货' },
            { value: 'in_transit', label: '运输中' },
            { value: 'delivered', label: '已完成' },
            { value: 'cancelled', label: '已取消' }
        ];

        statusOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            opt.selected = order.status === option.value;
            statusSelect.appendChild(opt);
        });
        statusCell.appendChild(statusSelect);

        // 创建操作单元格
        const actionCell = row.insertCell(10);
        const updateBtn = document.createElement('button');
        updateBtn.textContent = '更新状态';
        updateBtn.className = 'update-status-btn';
        updateBtn.onclick = () => updateOrderStatus(order.id); // 绑定点击事件，传递订单 ID
        actionCell.appendChild(updateBtn);
    });
}

/**
 * 更新订单状态函数
 * @param {number} orderId - 要更新的订单 ID
 */
async function updateOrderStatus(orderId) {
    console.log('--- 开始更新订单状态 ---');
    console.log('订单ID:', orderId);

    // 检查加载锁，如果正在加载，则等待或稍后重试
    if (window.isLoadingOrders) {
        console.log('检测到正在加载订单，等待加载完成后再尝试更新状态。');
        // 简单的等待和重试逻辑
        setTimeout(() => updateOrderStatus(orderId), 500); // 500ms 后重试
        return;
    }

    // 使用更健壮的查询方式，直接在当前行内查找 select
    const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
    if (!orderRow) {
        console.error(`找不到订单 ${orderId} 对应的行`);
        showMessage(`更新失败: 找不到订单 ${orderId} 的行`, true);
        return;
    }

    // 在当前行内查找状态选择框
    const selectElement = orderRow.querySelector('select.status-select');
    console.log('找到的选择框:', selectElement); // 调试信息
    if (!selectElement) {
        console.error(`找不到订单 ${orderId} 的状态选择框`);
        showMessage(`更新失败: 找不到订单 ${orderId} 的状态选择框`, true);
        return;
    }
    const newStatus = selectElement.value;
    console.log('选中的新状态:', newStatus); // 调试信息

    // 获取按钮引用，用于后续禁用/启用
    const updateBtn = orderRow.querySelector('.update-status-btn');
    if (updateBtn) {
        updateBtn.disabled = true; // 禁用按钮，防止重复点击
        updateBtn.textContent = '更新中...';
        console.log(`禁用按钮 for order ${orderId}`);
    }

    try {
        console.log('准备发送 PUT 请求...');
        // 调用正确的 API 路径 /admin/orders/{id}/status，与 OpenAPI 一致
        await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status: newStatus } // 发送新的状态
        });
        console.log('服务器返回结果: Success'); // 调试信息

        // 显示成功消息
        showMessage(`订单 ${orderId} 状态已更新为: ${newStatus}`, false);

        // 请求成功后，主动刷新整个订单列表以获取最新数据
        console.log('状态更新成功，准备刷新订单列表...');
        await loadAllOrders(); // 等待刷新完成
        console.log('订单列表刷新完成。');
    } catch (error) {
        console.error('更新订单状态失败:', error);
        showMessage(`更新订单状态失败: ${error.message}`, true);
    } finally {
        // 在请求结束后，无论成功失败，都启用按钮
        if (updateBtn) {
            updateBtn.disabled = false; // 启用按钮
            updateBtn.textContent = '更新状态';
            console.log(`启用按钮 for order ${orderId}`);
        }
    }
    console.log('--- 结束更新订单状态 ---');
}

// 页面加载完成后初始化 (如果此脚本用于订单管理页面)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllOrders);
} else {
    // loadAllOrders(); // 如果需要自动加载，取消注释
}