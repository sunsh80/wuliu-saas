// services/tenantService.js
const { run, get } = require('../database');

async function createTenant(tenantData) {
  // 检查邮箱是否已存在
  const existing = await get('SELECT id FROM tenants WHERE email = ?', [tenantData.email]);
  if (existing) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  // 插入新租户
  const sql = `
    INSERT INTO tenants (
      name, contact_person, contact_phone, email, password_hash, roles, address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  const params = [
    tenantData.name,
    tenantData.contact_person,
    tenantData.contact_phone,
    tenantData.email,
    tenantData.password_hash,
    JSON.stringify(tenantData.roles),
    tenantData.address
  ];

  const result = await run(sql, params);
  return { id: result.lastID, ...tenantData };
}

module.exports = { createTenant };