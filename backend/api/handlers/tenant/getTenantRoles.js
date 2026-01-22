// getTenantRoles.js

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

    // 获取用户的角色信息
    const user = await db.get(
      `SELECT roles, role, tenant_id FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return {
        statusCode: 404,
        body: { success: false, error: 'USER_NOT_FOUND' }
      };
    }

    // 解析角色
    let roles = [];
    if (user.roles) {
      try {
        roles = JSON.parse(user.roles);
        if (!Array.isArray(roles)) {
          roles = [String(roles)];
        }
      } catch (e) {
        roles = [user.role || 'user'].filter(r => r);
      }
    } else if (user.role) {
      roles = [user.role];
    }

    // 如果用户属于租户，也获取租户的角色
    if (user.tenant_id) {
      const tenant = await db.get(
        `SELECT roles as tenant_roles FROM tenants WHERE id = ?`,
        [user.tenant_id]
      );

      if (tenant && tenant.tenant_roles) {
        try {
          const tenantRoles = JSON.parse(tenant.tenant_roles);
          if (Array.isArray(tenantRoles)) {
            // 合并用户角色和租户角色，去重
            roles = [...new Set([...roles, ...tenantRoles])];
          }
        } catch (e) {
          console.error('解析租户角色失败:', e.message);
        }
      }
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          roles: roles
        }
      }
    };
  } catch (error) {
    console.error('Error getting tenant roles:', error);
    return {
      statusCode: 500,
      body: { success: false, error: 'INTERNAL_ERROR' }
    };
  }
};
