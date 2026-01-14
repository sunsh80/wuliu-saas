const { createTenant } = require('../../../db/index.js');
const bcrypt = require('bcrypt');

module.exports = async (c) => {
  console.log('🟢 [applyPcTenant] 收到请求，参数:', JSON.stringify(c.request.body, null, 2));
  const { name, contact_person, contact_phone, email, password, roles, address = '' } = c.request.body;

  if (!name || !contact_person || !contact_phone || !email || !password || !Array.isArray(roles) || roles.length === 0) {
    console.log('🔴 [applyPcTenant] 校验失败：缺少必填字段');
    return { statusCode: 400, body: { success: false, error: 'MISSING_REQUIRED_FIELDS' } };
  }

  if (password.length < 6) {
    console.log('🔴 [applyPcTenant] 校验失败：密码长度小于6');
    return { statusCode: 400, body: { success: false, error: 'PASSWORD_TOO_SHORT' } };
  }

  const validRoles = ['customer', 'carrier'];
  if (!roles.every(r => validRoles.includes(r))) {
    console.log('🔴 [applyPcTenant] 校验失败：包含无效角色，roles =', roles);
    return { statusCode: 400, body: { success: false, error: 'INVALID_ROLE' } };
  }

  try {
    console.log('🟡 [applyPcTenant] 开始加密密码...');
    const password_hash = await bcrypt.hash(password, 10);
    console.log('🟢 [applyPcTenant] 密码加密成功');

    const rolesJson = JSON.stringify(roles);
    console.log('🟡 [applyPcTenant] 开始调用 createTenant 创建租户...');
    const newTenant = await createTenant({
      name,
      contact_person,
      contact_phone,
      email,
      password_hash,
      roles: rolesJson,
      address
    });
    console.log('🟢 [applyPcTenant] 租户创建成功，ID:', newTenant.id);

    // 🔧 增容修复：自动创建 users 表记录（关键新增逻辑）
    console.log('🟡 [applyPcTenant] 开始创建关联用户记录...');
    const db = require('../../../db/index.js').getDb(); // 获取数据库实例

    // 生成 username（使用邮箱前缀）
    const username = email.split('@')[0];

    // 确定主角色（优先 carrier，否则 customer）
    const mainRole = roles.includes('carrier') ? 'carrier' : 'customer';

    // 确定激活状态：carrier 需审批（is_active=0），customer 直接激活（is_active=1）
    const isActive = roles.includes('carrier') ? 0 : 1;

    // 插入 users 记录
    await db.run(`
      INSERT INTO users (
        username, email, name, role, type,
        password_hash, tenant_id, user_type, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      username,
      email,
      name,
      mainRole,
      'tenant',
      password_hash,
      newTenant.id,
      'tenant_user',
      isActive
    ]);
    console.log('🟢 [applyPcTenant] 关联用户创建成功，username:', username);

    const response = {
      statusCode: 201,
      body: {
        id: newTenant.id,
        name: newTenant.name,
        contact_person: newTenant.contact_person,
        contact_phone: newTenant.contact_phone,
        email: newTenant.email,
        roles: JSON.parse(newTenant.roles),
        address: newTenant.address,
        created_at: newTenant.created_at
      }
    };

    console.log('✅ [applyPcTenant] 返回成功响应:', JSON.stringify(response.body, null, 2));
    return response;
  } catch (error) {
    console.error('💥 [applyPcTenant] 执行过程中发生异常:', error.message || error.stack || error);
    if (error.message?.includes?.('UNIQUE constraint failed: tenants.email')) {
      console.log('⚠️ [applyPcTenant] 邮箱已存在');
      return { statusCode: 409, body: { success: false, error: 'EMAIL_ALREADY_REGISTERED' } };
    }
    // 🔥 关键修复：确保所有异常都有返回！
    console.log('⚠️ [applyPcTenant] 返回 500 内部错误');
    return { statusCode: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};