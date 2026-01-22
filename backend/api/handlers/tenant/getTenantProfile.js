// getTenantProfile.js

const { getDb } = require('../../../db/index.js');

/**
 * @param {import('openapi-backend').Context} c
 */
module.exports = async (c) => {
  try {
    const userId = c.context?.id;
    if (!userId) {
      return {
        statusCode: 401,
        body: { success: false, error: 'UNAUTHORIZED' }
      };
    }

    const db = getDb();

    // 获取用户和租户信息，避免字段名冲突
    const result = await db.get(`
      SELECT
        u.id as user_id,
        u.email as user_email,
        u.username,
        u.name as user_name,
        u.roles as user_roles,
        u.role as user_role,
        u.user_type,
        u.tenant_id,
        t.id as tenant_id,
        t.name as tenant_name,
        t.contact_person,
        t.contact_phone,
        t.email as tenant_email,
        t.roles as tenant_roles,
        t.status as tenant_status,
        t.address
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?
    `, [userId]);

    if (!result) {
      return {
        statusCode: 404,
        body: { success: false, error: 'USER_NOT_FOUND' }
      };
    }

    // 解析角色
    let roles = [];
    if (result.user_roles) {
      try {
        roles = JSON.parse(result.user_roles);
        if (!Array.isArray(roles)) {
          roles = [String(roles)];
        }
      } catch (e) {
        roles = [result.user_role || 'user'].filter(r => r);
      }
    } else if (result.user_role) {
      roles = [result.user_role];
    }

    const profile = {
      id: result.user_id,
      email: result.user_email,
      username: result.username,
      name: result.user_name,
      roles: roles,
      user_type: result.user_type,
      tenant_id: result.tenant_id,
      ...(result.tenant_id && {
        tenant: {
          id: result.tenant_id,
          name: result.tenant_name, // 租户名称
          contact_person: result.contact_person,
          contact_phone: result.contact_phone,
          email: result.tenant_email,
          roles: roles,
          status: result.tenant_status || 'active',
          address: result.address
        }
      })
    };

    return {
      statusCode: 200,
      body: {
        success: true,
        data: profile
      }
    };
  } catch (error) {
    console.error('Error getting tenant profile:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_ERROR' }
    };
  }
};
