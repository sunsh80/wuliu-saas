// backend/middleware/auth.js
const { getDb } = require('../db'); // 确保引入数据库实例
const { jwt } = require('../utils');

module.exports = {
  // 登录请求强制新session
  loginSessionReset: (req, res, next) => {
    if (req.path === '/api/tenant-web/login' || req.path === '/api/admin/login') {
      next(); // 安全：不干预登录请求
    } else {
      next(); // 对于非登录请求，继续执行中间件
    }
  },

  // OpenAPI安全处理器
  openApiSecurityHandler: (api) => {
    return async (c) => { // 必须是 async 函数
      console.log('\n🛡️ [SECURITY HANDLER CALLED]');
      console.log(' → Path:', c.request.path);
      console.log(' → Method:', c.request.method);
      console.log(' → Operation:', c.operation?.operationId);
      // console.log(' → Raw Request Headers:', c.req.raw.headers); // 移除这一行，它是错误的来源

      // *** 添加这一行关键日志 ***
      console.log(' → Session Check (c.request.session):', c.request.session);
      console.log(' → Session User ID (c.request.session?.userId):', c.request.session?.userId);

      const session = c.request.session;
      console.log(' → Session ID:', c.request.sessionID);
      console.log(' → Session exists?', !!session);
      if (process.env.NODE_ENV === 'development') {
        console.log(' → Session content:', JSON.stringify(session || {}, null, 2));
      }
      console.log(' → Session.userId value:', session?.userId);

      const security = c.operation?.security;
      // 不需要认证的接口
      if (Array.isArray(security) && security.length === 0) {
        console.log(' → ✅ 此端点不需要认证 (security: [])');
        if (session?.userId) {
          // 对于免认证接口，仍可注入基础上下文
          c.context = c.context || {};
          c.context.id = session.userId;
          c.context.tenantId = session.tenantId;
        }
        return true;
      }

      let userId = null;

      // 检查 session 中的 userId
      if (session?.userId) {
        userId = session.userId;
        console.log(' → 使用 Session 中的 userId:', userId);
      }
      // 如果没有 session，尝试从 Authorization header 解析 JWT token
      else {
        const authHeader = c.request.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_testing');
            userId = decoded.id;
            console.log(' → 从 JWT Token 解析出 userId:', userId);
            
            // ✅ 关键修复：将解析出的用户信息设置到 session 中
            if (c.request.session) {
              c.request.session.userId = decoded.id;
              c.request.session.tenantId = decoded.tenantId;
              // 同时设置 c.session 别名（兼容现有 handler）
              c.session = c.request.session;
              console.log(' → ✅ 已将 userId 和 tenantId 设置到 session');
            }
          } catch (err) {
            console.log(' → ❌ JWT Token 验证失败:', err.message);
            return [401, { success: false, error: 'UNAUTHORIZED' }];
          }
        }
      }

      // 需要认证的接口
      if (!userId) {
        console.log(' → ❌ 认证失败：没有用户ID (session 或 token)');
        return [401, { success: false, error: 'UNAUTHORIZED' }];
      }

      // ✅ 关键修复：从数据库获取用户完整信息
      try {
        const db = getDb();
        const user = await db.get(
          `SELECT u.tenant_id, u.roles, u.role, u.user_type, t.roles as tenant_roles FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?`,
          [userId]
        );

        if (!user) {
          console.log(' → ❌ 用户不存在');
          return [401, { success: false, error: 'USER_NOT_FOUND' }];
        }

        // ✅ 正确注入上下文（含 roles）
        // 优先使用 users 表中的 roles（JSON格式），如果没有则使用 role（单个角色）或从 tenants 表获取
        let roles = [];
        if (user.roles) {
          try {
            roles = JSON.parse(user.roles);
            if (!Array.isArray(roles)) {
              console.warn(' → ⚠️ 用户 roles 字段不是数组，尝试转换:', roles);
              roles = [String(roles)]; // 确保是字符串数组
            }
          } catch (parseError) {
            console.error(' → ❌ 解析用户 roles 失败:', parseError.message);
            // 如果解析失败，尝试使用单个角色
            if (user.role) {
              roles = [user.role];
            } else if (user.tenant_roles) {
              try {
                roles = JSON.parse(user.tenant_roles);
                if (!Array.isArray(roles)) {
                  roles = [String(roles)];
                }
              } catch (tenantParseError) {
                console.error(' → ❌ 解析租户 roles 失败:', tenantParseError.message);
                roles = []; // 最后兜底为空数组
              }
            } else {
              roles = [user.role || 'user'].filter(r => r); // 使用单个角色作为备选
            }
          }
        } else if (user.role) {
          roles = [user.role]; // 单个角色转换为数组
        } else if (user.tenant_roles) {
          try {
            roles = JSON.parse(user.tenant_roles);
            if (!Array.isArray(roles)) {
              roles = [String(roles)];
            }
          } catch (tenantParseError) {
            console.error(' → ❌ 解析租户 roles 失败:', tenantParseError.message);
            roles = [user.role || 'user'].filter(r => r); // 使用单个角色作为备选
          }
        }

        // --- 🔧 问题修复：改用逐个属性设置，确保 c.context 被正确填充 ---
        c.context = c.context || {}; // 确保 c.context 对象存在
        c.context.id = userId;
        c.context.tenantId = user.tenant_id;
        c.context.roles = roles;
        c.context.userType = user.user_type; // 添加用户类型到上下文中
        // --- 🔧 修复结束 ---

        console.log(' → ✅ 认证通过，userId:', userId, 'roles:', c.context.roles);
        return true;
      } catch (error) {
        console.error(' → 🚨 数据库查询失败:', error.message);
        return [500, { success: false, error: 'INTERNAL_ERROR' }];
      }
    };
  }
};