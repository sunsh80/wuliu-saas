// api/handlers/auth/adminLogin.js
console.log('Trying to load db from:', __dirname);
const { getDb } = require('../../../../db/index.js');
const { bcrypt, jwt } = require('../../../../utils');

module.exports = async (c) => {
  const { username, password } = c.request.body;

  if (!username || !password) {
    return {
      status: 400,
      body: { success: false, error: 'Username and password are required' }
    };
  }

  const db = getDb();
  const user = await db.get(
    `SELECT id, username, email, phone, name, role, type, password_hash, organization_id, organization_name, organization_type, is_active 
     FROM users 
     WHERE phone = ? AND type = 'admin'`,
    [username]
  );

  // ✅ 使用 bcrypt.compare 安全验证密码（不再用明文 'admin123'）
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return {
      status: 401,
      body: { success: false, error: 'Invalid credentials' }
    };
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role
    },
    process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
    { expiresIn: '24h' }
  );

  return {
    status: 200,
    body: {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          name: user.name,
          role: user.role,
          type: user.type,
          organization_id: user.organization_id
        }
      }
    }
  };
};