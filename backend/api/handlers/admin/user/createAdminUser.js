// api/handlers/admin-user/createAdminUser.js
console.log('✅ Loading createAdminUser handler...');
const { getDb } = require('../../../../db/index.js');
const { bcrypt } = require('../../../../utils');

module.exports = async (c) => {
  const { username, password, email, phone, name, role } = c.request.body;
  const adminOrgId = 'admin_org_id_001'; // 固定总后台组织ID

  const database = getDb();

  // 检查唯一性
  if (await database.get(`SELECT 1 FROM users WHERE username = ? AND organization_id = ?`, [username, adminOrgId])) {
    return { statusCode: 409, body: { success: false, error: 'Username already exists' } };
  }
  if (email && await database.get(`SELECT 1 FROM users WHERE email = ?`, [email])) {
    return { statusCode: 409, body: { success: false, error: 'Email already exists' } };
  }
  if (phone && await database.get(`SELECT 1 FROM users WHERE phone = ?`, [phone])) {
    return { statusCode: 409, body: { success: false, error: 'Phone number already exists' } };
  }

  // 创建用户
  const hashedPassword = await bcrypt.hash(password, 10);

  // 处理角色 - 如果传入的是字符串，转换为数组；如果是数组，直接使用
  let rolesArray = [];
  if (typeof role === 'string') {
    rolesArray = [role];
  } else if (Array.isArray(role)) {
    rolesArray = role;
  } else {
    rolesArray = ['user']; // 默认角色
  }

  const newUser = {
    id: require('crypto').randomUUID(),
    username,
    email: email || null,
    phone: phone || null,
    name: name || username,
    role: rolesArray[0], // 使用第一个角色作为主要角色
    roles: JSON.stringify(rolesArray), // 存储所有角色
    type: 'admin',
    organization_id: adminOrgId,
    organization_name: 'Logistics Admin',
    organization_type: 'admin',
    password_hash: hashedPassword,
    is_active: 1
  };

  await database.run(
    `INSERT INTO users (id, username, email, phone, name, role, roles, type, organization_id, organization_name, organization_type, password_hash, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    Object.values(newUser)
  );

  const createdUser = await database.get(`SELECT * FROM users WHERE id = ?`, [newUser.id]);

  return {
    status: 201,
    body: {
      success: true,
      message: 'Admin user created',
      data: { user: createdUser }
    }
  };
};
// 在文件最底部加上：
console.log('DEBUG createAdminUser export type:', typeof module.exports);