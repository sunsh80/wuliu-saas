// backend/api/handlers/tenant-web/loginTenantWeb.js
const bcrypt = require('bcrypt');
const { getDb } = require('../../../db/index.js');

module.exports = async (c) => {
  const { email, phone, password, code } = c.request.body;
  const db = getDb();

  try {
    // === 模式 1: 租户登录（邮箱 + 密码）===
    if (email && password) {
      console.log('🔐 尝试租户登录:', email);
      const user = await db.get(`
        SELECT u.id, u.email, u.password_hash, u.tenant_id, t.name AS tenant_name, t.roles, t.status AS tenant_status
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = ? AND u.user_type = 'tenant_user' AND t.status = 'active'
      `, [email.toLowerCase().trim()]);

      if (!user) {
        console.log('📤 Login response:', { success: false, error: 'INVALID_CREDENTIALS' });
        return {
          statusCode: 401,
          body: { success: false, error: 'INVALID_CREDENTIALS' }
        };
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        console.log('📤 Login response:', { success: false, error: 'INVALID_CREDENTIALS' });
        return {
          statusCode: 401,
          body: { success: false, error: 'INVALID_CREDENTIALS' }
        };
      }

      const userId = user.id;
      const data = {
        tenant_id: user.tenant_id,
        name: user.tenant_name,
        roles: Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles || '[]'),
        type: 'tenant'
      };
      console.log('📤 Login response:', { userId, data });
      return {
        statusCode: 200,
        body: {
          success: true,
          userId: user.id,
          data: data
        }
      };
    }

    // === 模式 2: 客户登录（手机号 + 密码）===
    if (phone && password) {
      console.log('📱 尝试客户密码登录:', phone);
      const user = await db.get(`
        SELECT id, phone, password_hash, user_type
        FROM users
        WHERE phone = ? AND user_type = 'user'
      `, [phone]);

      if (!user) {
        console.log('📤 Login response:', { success: false, error: 'INVALID_CREDENTIALS' });
        return {
          statusCode: 401,
          body: { success: false, error: 'INVALID_CREDENTIALS' }
        };
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        console.log('📤 Login response:', { success: false, error: 'INVALID_CREDENTIALS' });
        return {
          statusCode: 401,
          body: { success: false, error: 'INVALID_CREDENTIALS' }
        };
      }

      const userId = user.id;
      const data = { phone: user.phone, type: 'customer' };
      console.log('📤 Login response:', { userId, data });
      return {
        statusCode: 200,
        body: {
          success: true,
          userId: user.id,
          data: data
        }
      };
    }

    // === 模式 3: 客户登录（手机号 + 验证码）===
    if (phone && code) {
      console.log('📱 尝试客户验证码登录:', phone);
      const isValidCode = await validateSmsCode(phone, code);
      if (!isValidCode) {
        console.log('📤 Login response:', { success: false, error: 'INVALID_CODE' });
        return {
          statusCode: 401,
          body: { success: false, error: 'INVALID_CODE' }
        };
      }

      let customer = await db.get(
        `SELECT id FROM users WHERE phone = ? AND user_type = 'user'`,
        [phone]
      );

      if (!customer) {
        console.log('📤 Login response:', { success: false, error: 'USER_NOT_FOUND' });
        const newCustomerId = await createCustomerUser(phone);
        customer = { id: newCustomerId };
      }

      const userId = customer.id;
      const data = { phone: phone, type: 'customer' };
      console.log('📤 Login response:', { userId, data });
      return {
        statusCode: 200,
        body: {
          success: true,
          userId: userId,
          data: data
        }
      };
    }

    console.log('📤 Login response:', { success: false, error: 'MISSING_PARAMS' });
    return {
      statusCode: 400,
      body: { success: false, error: 'MISSING_PARAMS' }
    };

  } catch (error) {
    console.error('[loginTenantWeb] Error:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_ERROR' }
    };
  }
};

// 辅助函数
async function validateSmsCode(phone, code) {
  return code === '123456'; // 示例
}

async function createCustomerUser(phone) {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO users (phone, username, user_type, is_active)
     VALUES (?, ?, 'user', 1)`,
    [phone, phone] // username = phone
  );
  return result.lastID;
}