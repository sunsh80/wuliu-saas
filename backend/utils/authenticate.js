/**
 * 统一的请求认证工具
 * 支持 JWT Token 和 Session 两种认证方式
 */

const { jwt } = require('./index');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_testing';

/**
 * 从请求中提取并验证用户身份
 * 优先使用 JWT Token，其次使用 Session
 * 
 * @param {Object} req - Express 请求对象
 * @returns {Object|null} 用户信息对象 { id, tenantId }，如果认证失败则返回 null
 */
function authenticateRequest(req) {
  // 首先尝试从 Authorization header 解析 JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        id: decoded.id,
        tenantId: decoded.tenantId
      };
    } catch (err) {
      console.error(' → JWT Token 验证失败:', err.message);
      return null;
    }
  }

  // 其次尝试从 session 获取
  if (req.session && req.session.userId) {
    return {
      id: req.session.userId,
      tenantId: req.session.tenantId
    };
  }

  return null;
}

module.exports = {
  authenticateRequest
};
