// public/admin/js/applicationManager.js
// 引入 apiRequest 和 showMessage (需要在 HTML 中先引入 api.js 和 auth.js)

/**
 * 加载所有待审核的入驻申请
 */
async function loadPendingTenants() {
    try {
        // 使用 apiRequest，路径与 OpenAPI 一致
        const response = await apiRequest('/admin/tenants/pending');
        // OpenAPI 定义的响应结构是 { data: [...] }
        const tenants = response.data;

        displayPendingTenants(tenants);
    } catch (error) {
        console.error('加载待审核申请失败:', error);
        showMessage(`加载待审核申请失败: ${error.message}`, true);
    }
}

/**
 * 显示待审核申请数据到表格
 * @param {Array} tenants - 租户数据数组
 */
function displayPendingTenants(tenants) {
    if (!Array.isArray(tenants)) {
        showMessage('服务器返回的数据格式不正确', true);
        return;
    }
    const tbody = document.getElementById('pending-tenants-body');
    const noTenantsMsg = document.getElementById('no-pending-tenants-message');

    if (tenants.length === 0) {
        // 如果没有数据，显示暂无数据行
        tbody.innerHTML = '';
        noTenantsMsg.style.display = 'table-row';
        return;
    }

    // 如果有数据，隐藏暂无数据行
    noTenantsMsg.style.display = 'none';
    tbody.innerHTML = ''; // 清空现有内容

    tenants.forEach(tenant => {
        const row = tbody.insertRow();
        row.setAttribute('data-tenant-id', tenant.id);

        const createdAt = new Date(tenant.created_at).toLocaleString();
        row.innerHTML = `
            <td>${tenant.id}</td>
            <td>${tenant.name}</td>
            <td>${tenant.contact_person}</td>
            <td>${tenant.contact_phone}</td>
            <td>${createdAt}</td>
            <td>
                <button class="btn btn-success" onclick="approveTenant(${tenant.id})">通过</button>
                <button class="btn btn-danger" onclick="rejectTenantPrompt(${tenant.id})">拒绝</button>
                <button class="btn btn-info" onclick="viewTenantDetails(${tenant.id})">查看附件</button>
            </td>
        `;
    });
}

/**
 * 通过入驻申请
 * @param {number} id - 租户 ID
 */
async function approveTenant(id) {
    if (!confirm(`确定通过租户 ID: ${id} 的申请吗？`)) return;
    try {
        await apiRequest(`/admin/tenants/${id}/approve`, {
            method: 'PUT',
            body: { roles: ["customer", "carrier"] } // 示例角色分配
        });
        showMessage('申请已通过', false);
        loadPendingTenants(); // 刷新列表
    } catch (error) {
        console.error('通过申请失败:', error);
        showMessage(`操作失败: ${error.message}`, true);
    }
}

/**
 * 拒绝入驻申请 (带备注)
 * @param {number} id - 租户 ID
 */
async function rejectTenantPrompt(id) {
    const notes = prompt('请输入拒绝原因:');
    if (notes === null || notes.trim() === '') return;
    try {
        await apiRequest(`/admin/tenants/${id}/reject`, {
            method: 'PUT',
            body: { notes: notes.trim() }
        });
        showMessage('申请已拒绝', false);
        loadPendingTenants(); // 刷新列表
    } catch (error) {
        console.error('拒绝申请失败:', error);
        showMessage(`操作失败: ${error.message}`, true);
    }
}

/**
 * 查看租户详情 (占位符)
 * @param {number} id - 租户 ID
 */
function viewTenantDetails(id) {
    // TODO: 实现查看附件功能
    alert(`查看租户 ${id} 的附件详情功能待实现。`);
}

// 页面加载完成后初始化 (如果此脚本用于入驻申请管理页面)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPendingTenants);
} else {
    // loadPendingTenants(); // 如果需要自动加载，取消注释
}