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
        SELECT u.id, u.email, u.password_hash, u.tenant_id, u.roles, u.role, t.name AS tenant_name, t.roles AS tenant_roles, t.status AS tenant_status
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = ? AND u.user_type = 'tenant_user'
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

      // 设置会话信息 - 这是关键修复
      if (!c.request.session) {
        console.error('❌ 会话对象不存在');
        return {
          statusCode: 500,
          body: { success: false, error: 'SESSION_ERROR' }
        };
      }
      c.request.session.userId = user.id;
      c.request.session.tenantId = user.tenant_id;
      c.request.session.userType = 'tenant_user'; // 添加用户类型
      console.log('🔐 会话已设置:', { userId: user.id, tenantId: user.tenant_id, userType: 'tenant_user' });

      // 解析角色 - 优先使用用户的角色，如果没有则使用租户的角色
      let roles = [];
      if (user.roles) {
        try {
          roles = JSON.parse(user.roles);
          if (!Array.isArray(roles)) {
            roles = [String(roles)];
          }
        } catch (e) {
          console.error('解析用户角色失败:', e.message);
          // 如果用户角色解析失败，尝试使用租户角色
          if (user.tenant_roles) {
            try {
              roles = JSON.parse(user.tenant_roles);
              if (!Array.isArray(roles)) {
                roles = [String(roles)];
              }
            } catch (tenantRoleError) {
              console.error('解析租户角色失败:', tenantRoleError.message);
              roles = [user.role || 'user'].filter(r => r);
            }
          } else {
            roles = [user.role || 'user'].filter(r => r);
          }
        }
      } else if (user.tenant_roles) {
        // 如果用户没有角色，尝试使用租户的角色
        try {
          roles = JSON.parse(user.tenant_roles);
          if (!Array.isArray(roles)) {
            roles = [String(roles)];
          }
        } catch (tenantRoleError) {
          console.error('解析租户角色失败:', tenantRoleError.message);
          roles = [user.role || 'user'].filter(r => r);
        }
      } else {
        roles = [user.role || 'user'].filter(r => r);
      }

      const userId = user.id;
      const data = {
        tenant_id: user.tenant_id,
        name: user.tenant_name,
        roles: roles,
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
      console.log('🔍 Login attempt for phone:', phone);
      try {
        console.log('🔍 Attempting customer password login for:', phone);
        const user = await db.get(
          `SELECT id, phone, password_hash, tenant_id FROM users WHERE phone = ? AND user_type = 'tenant_user'`,
          [phone]
        );
        console.log('🔍 Retrieved user from DB (SQLite):', user);

        if (!user) {
          console.log('❌ User not found in DB for phone:', phone);
          return { statusCode: 401, body: { success: false, error: 'INVALID_CREDENTIALS' } };
        }

        console.log('🔍 Stored password hash from DB:', user.password_hash);
        console.log('🔍 Input password for comparison:', password);
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔍 Bcrypt compare result:', isValid);

        if (isValid) {
          console.log('✅ Login successful for phone:', phone);
          // 设置会话信息 - 这是关键修复
          if (!c.request.session) {
            console.error('❌ 会话对象不存在');
            return { statusCode: 500, body: { success: false, error: 'SESSION_ERROR' } };
          }

          // 确保 user.tenant_id 存在，否则可能需要从租户表查询或设置默认值
          // 假设 users 表中确实有 tenant_id 字段，否则需要查询
          // const userWithTenantInfo = await db.get("SELECT u.id, u.phone, u.tenant_id, t.name AS tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?", [user.id]);
          // c.request.session.tenantId = userWithTenantInfo?.tenant_id || user.tenant_id; // Fallback

          c.request.session.userId = user.id;
          console.log('🔐 会话已设置:', { userId: user.id });
          c.request.session.tenantId = user.tenant_id; // Ensure this field exists in DB query result
          c.request.session.userType = 'tenant_user';
          const userId = user.id; // Now 'user' should definitely be accessible here
          const data = { phone: user.phone, type: 'customer' };
          console.log('📤 Login response:', { userId, data });
          return { statusCode: 200, body: { success: true, userId: user.id, data: data } };
        } else {
          console.log('❌ Password verification failed for phone:', phone);
          return { statusCode: 401, body: { success: false, error: 'INVALID_CREDENTIALS' } };
        }
      } catch (error) {
        console.error('Error during customer login:', error.message);
        console.error('Full error stack:', error.stack);
        return { statusCode: 500, body: { success: false, error: 'INTERNAL_ERROR' } };
      }
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
        `SELECT id FROM users WHERE phone = ? AND user_type = 'tenant_user'`,
        [phone]
      );

      if (!customer) {
        console.log('📤 Login response:', { success: false, error: 'USER_NOT_FOUND' });
        const newCustomerId = await createCustomerUser(phone);
        customer = { id: newCustomerId };
      }

      // 设置会话信息 - 这是关键修复
      if (!c.request.session) {
        console.error('❌ 会话对象不存在');
        return {
          statusCode: 500,
          body: { success: false, error: 'SESSION_ERROR' }
        };
      }
      c.request.session.userId = customer.id;
      c.request.session.userType = 'tenant_user'; // 添加用户类型
      console.log('🔐 会话已设置:', { userId: customer.id });

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