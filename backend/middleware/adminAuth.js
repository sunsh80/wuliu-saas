// middleware/adminRoleAuth.js
const { getDb } = require('../db');

const adminRoleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    // 假设 adminAuth 中间件已经验证了 token 并设置了 req.user
    // 并且 req.user 包含了用户信息，包括 role

    // 检查 req.user 是否存在以及是否为 admin 类型用户
    if (!req.user || req.user.type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Not an admin user' });
    }

    try {
      // 1. 获取数据库实例
      const db = getDb();

      // 2. 检查数据库实例是否已准备好
      if (!db || typeof db.get !== 'function') {
        // 如果 db 为 null/undefined 或者没有 .get 方法，说明数据库未初始化
        console.error('Database connection is not ready yet in adminRoleAuth.');
        return res.status(500).json({
          success: false,
          error: 'Internal server error: Database connection is not initialized.'
        });
      }

      // 3. 数据库实例已准备好，执行查询逻辑
      const userRecord = await db.get(
        `SELECT role FROM users WHERE id = ? AND type = 'admin'`,
        [req.user.id]
      );

      if (!userRecord) {
        // 用户不存在或类型不匹配
        return res.status(403).json({ success: false, error: 'Access denied: User record not found or invalid' });
      }

      if (!allowedRoles.includes(userRecord.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied: Insufficient permissions. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRecord.role}`
        });
      }

      // 角色检查通过
      next();
    } catch (error) {
      console.error('Admin role auth error:', error);
      // 区分是数据库查询错误还是其他错误
      if (error.message && error.message.includes('SQLITE_')) {
         // 更具体的数据库错误
         return res.status(500).json({ success: false, error: 'Database query failed during role authorization check.' });
      }
      // 其他错误
      res.status(500).json({ success: false, error: 'Internal server error during role authorization check' });
    }
  };
};

module.exports = adminRoleAuth;