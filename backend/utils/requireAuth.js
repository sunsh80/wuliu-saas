// backend/utils/requireAuth.js
/**
 * 统一认证装饰器
 * 
 * 用法：
 * module.exports = requireAuth(async (c) => {
 *   // handler 逻辑，此时 c.context 已设置
 * });
 */

function requireAuth(handler) {
  return async (c) => {
    // 检查认证：如果 c.context 或 c.context.id 不存在，返回 401
    if (!c.context || !c.context.id) {
      return {
        statusCode: 401,
        body: {
          success: false,
          error: 'UNAUTHORIZED',
          message: '未授权访问，请先登录'
        }
      };
    }
    // 认证通过，执行 handler
    return await handler(c);
  };
}

module.exports = { requireAuth };
