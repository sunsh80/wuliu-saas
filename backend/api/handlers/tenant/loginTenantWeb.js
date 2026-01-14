// backend/api/handlers/tenant/loginTenantWeb.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../../db/index.js');

/**
 * 实现 /api/tenant-web/login 接口
 * 
 * OpenAPI 要求：
 * - POST /api/tenant-web/login
 * - Body: { email, password }
 * - 200: 登录成功
 * - 401: 邮箱或密码错误
 */
module.exports = async (c) => {
  const { email, password } = c.request.body;

  // 1. 验证请求参数（虽然 OpenAPI 已校验，但双重保险）
  if (!email || !password) {
    return {
      statusCode: 400,
      body: { success: false, error: 'EMAIL_AND_PASSWORD_REQUIRED' }
    };
  }

  try {
    const db = getDb();

    // 2. 查询租户用户
    // 根据行业惯例，租户的登录凭证通常存于 users 表，并关联 tenant_id
    // 字段命名参考常见实践：email, password_hash, tenant_id
    const user = await db.get(`
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.tenant_id,
        t.name AS tenant_name,
        t.roles
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      // 用户不存在 → 401
      return {
        statusCode: 401,
        body: { success: false, error: 'INVALID_CREDENTIALS' }
      };
    }

    // 3. 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return {
        statusCode: 401,
        body: { success: false, error: 'INVALID_CREDENTIALS' }
      };
    }

    // 4. 生成 JWT Token（使用环境变量密钥）
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email
      },
      process.env.JWT_SECRET || 'logistics-platform-jwt-secret-2026',
      { expiresIn: '24h' }
    );

    // 5. 返回 200 成功（OpenAPI 未指定 body，我们自行设计）
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
        }
      }
    };

  } catch (error) {
    console.error('[loginTenantWeb] 内部错误:', error.message);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_SERVER_ERROR' }
    };
  }
};