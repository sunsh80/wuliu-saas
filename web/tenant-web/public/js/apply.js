// pc-tenant/apply.js

// ========== 配置区 ==========
const API_BASE = 'http://localhost:3000'; // 开发环境
// const API_BASE = 'https://api.yourdomain.com'; // 生产环境（上线时取消注释）
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  const applyForm = document.getElementById('applyForm');
  const loginNowLink = document.getElementById('login-now-link');

  if (applyForm) {
    applyForm.addEventListener('submit', handleApplySubmit);
  }

  if (loginNowLink) {
    loginNowLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('跳转到登录页功能待实现');
    });
  }
});

// 处理入驻申请提交
async function handleApplySubmit(e) {
  e.preventDefault();
  const form = e.target;

  const data = {
    name: form.querySelector('input[name="name"]').value.trim(),
    contact_person: form.querySelector('input[name="contact_person"]').value.trim(),
    contact_phone: form.querySelector('input[name="contact_phone"]').value.trim(),
    address: form.querySelector('input[name="address"]').value.trim(),
    address: form.querySelector('input[name="email"]').value.trim(),
    business_license: form.querySelector('input[name="business_license"]').value.trim(),
    license_file: form.querySelector('input[name="license_file"]')?.value.trim() || '',
    other_files: form.querySelector('input[name="other_files"]')?.value.trim() || '',
    password: form.querySelector('input[name="password"]').value,
    roles: ['carrier']
  };

  const requiredFields = [{ name, contact_person, contact_phone, email, password, roles }];
  for (const field of requiredFields) {
    if (!data[field]) {
      alert('所有带 * 的字段都是必填的');
      return;
    }
  }

  try {
    const response = await fetch(`${API_BASE}/api/pc-tenant/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      alert('申请提交成功！请等待审核。');
      console.log('申请结果:', result);
      form.reset();
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('申请失败: ' + (errorData.error || '未知错误'));
    }
  } catch (error) {
    console.error('提交申请失败:', error);
    alert('网络错误，请稍后重试。');
  }
}