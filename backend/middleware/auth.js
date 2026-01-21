// backend/middleware/auth.js
const db = require('../db'); // 确保引入数据库实例

module.exports = {
  // 登录请求强制新session
  loginSessionReset: (req, res, next) => {
    if (req.path === '/api/tenant-web/login') {
      next(); // 安全：不干预登录请求
    }
  },

  // OpenAPI安全处理器
  openApiSecurityHandler: (api) => {
    return async (c) => { // ← 必须是 async 函数
      console.log('\n🛡️ [SECURITY HANDLER CALLED]');
      console.log(' → Path:', c.request.path);
      console.log(' → Method:', c.request.method);
      console.log(' → Operation:', c.operation?.operationId);
      
      const session = c.request.session;
      console.log(' → Session ID:', c.request.sessionID);
      console.log(' → Session exists?', !!session);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(' → Session content:', JSON.stringify(session || {}, null, 2));
      }

      const security = c.operation?.security;
      
      // 不需要认证的接口
      if (Array.isArray(security) && security.length === 0) {
        console.log(' → ✅ 此端点不需要认证 (security: [])');
        if (session?.userId) {
          // 对于免认证接口，仍可注入基础上下文
          c.context = { 
            id: session.userId, 
            tenantId: session.tenantId 
          };
        }
        return true;
      }

      // 需要认证的接口
      if (!session?.userId) {
        console.log(' → ❌ 认证失败：没有用户ID');
        return [401, { success: false, error: 'UNAUTHORIZED' }];
      }

      // ✅ 关键修复：从数据库获取用户完整信息
      try {
        const user = await db.get(
          `SELECT tenant_id, roles FROM users WHERE id = ?`,
          [session.userId]
        );

        if (!user) {
          console.log(' → ❌ 用户不存在');
          return [401, { success: false, error: 'USER_NOT_FOUND' }];
        }

        // ✅ 正确注入上下文（含 roles）
        c.context = {
          id: session.userId,
          tenantId: user.tenant_id,
          roles: JSON.parse(user.roles || '[]')
        };
        
        console.log(' → ✅ 认证通过，userId:', session.userId, 'roles:', c.context.roles);
        return true;
        
      } catch (error) {
        console.error(' → 🚨 数据库查询失败:', error.message);
        return [500, { success: false, error: 'INTERNAL_ERROR' }];
      }
    };
  }
};