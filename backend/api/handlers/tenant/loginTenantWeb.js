// backend/api/handlers/tenant/loginTenantWeb.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../../db/index.js');

module.exports = async (c /*, req, res */) => {
  const { email, password } = c.request.body;

  if (!email || !password) {
    return {
      statusCode: 400,
      body: { success: false, error: 'EMAIL_AND_PASSWORD_REQUIRED' }
    };
  }

  try {
    const db = getDb();

    const user = await db.get(`
      SELECT u.id, u.email, u.password_hash, u.tenant_id, t.name AS tenant_name, t.roles
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      console.log("[loginTenantWeb] User not found for email:", email);
      return {
        statusCode: 401,
        body: { success: false, error: 'INVALID_CREDENTIALS' }
      };
    }

    // 添加日志，查看查询到的 user 对象
    console.log("[loginTenantWeb] Retrieved user object:", user);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log("[loginTenantWeb] Invalid password for email:", email);
      return {
        statusCode: 401,
        body: { success: false, error: 'INVALID_CREDENTIALS' }
      };
    }

    // 此时 user 对象应该包含 id, email, tenant_id 等信息
    console.log("[loginTenantWeb] User authentication successful, preparing session data.");

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email
      },
      process.env.JWT_SECRET || 'logistics-platform-jwt-secret-2026',
      { expiresIn: '24h' }
    );

    // 检查 sessionData 的内容
    const sessionDataToReturn = {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email
    };
    console.log("[loginTenantWeb] Preparing sessionData to return:", sessionDataToReturn);

    return {
      statusCode: 200,
      body: {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          tenant_name: user.tenant_name
        },
        sessionData: sessionDataToReturn // 这个字段必须存在
      }
    };
  } catch (error) {
    console.error('[loginTenantWeb] 内部错误:', error.message);
    console.error('[loginTenantWeb] Error Stack:', error.stack);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_SERVER_ERROR' }
    };
  }
};