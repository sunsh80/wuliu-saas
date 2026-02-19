/**
 * JWT 认证中间件
 * 用于验证 Authorization: Bearer <token> 请求
 */

const { jwt: jwtUtils } = require('../utils');

/**
 * JWT 认证中间件
 * 验证 Authorization header 中的 Bearer token，并将用户信息设置到 req.session.userId
 */
function jwtAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未授权访问：缺少 Authorization header'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwtUtils.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_testing');
    
    // 将用户 ID 设置到 session 中，以便后续处理器使用
    req.session.userId = decoded.id;
    req.session.tenantId = decoded.tenantId;
    
    console.log('✅ JWT 认证通过:', { userId: decoded.id, tenantId: decoded.tenantId });
    
    next();
  } catch (error) {
    console.error('❌ JWT 验证失败:', error.message);
    return res.status(401).json({
      success: false,
      message: '未授权访问：Token 无效或已过期',
      error: error.message
    });
  }
}

module.exports = jwtAuthMiddleware;
