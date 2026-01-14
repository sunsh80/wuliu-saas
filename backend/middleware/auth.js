// middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { getDb } = require('../db'); // 使用 db.js 提供的数据库连接

function createAuthMiddleware(scope) { // scope: 'tenant', 'user', 'admin'
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access token required' });
        }

        try {
            const decoded = verifyToken(token);

            // 验证 Token 中的 userType 是否符合预期 scope
            // 注意：确保 login 时生成的 token 中的 userType 与此处一致
            const expectedUserType = scope === 'admin' ? 'admin_user' : `${scope}_user`;
            if (decoded.userType !== expectedUserType) {
                return res.status(403).json({ success: false, error: 'Invalid token scope' });
            }

            // 验证用户是否依然存在且有效
            const db = getDb();
            const userRecord = await db.get(
                `SELECT id, username, email, phone, name, role, type, organization_id, organization_name, organization_type, is_active FROM users WHERE id = ?`,
                [decoded.userId]
            );

            if (!userRecord || !userRecord.is_active) {
                return res.status(401).json({ success: false, error: 'Invalid or inactive user' });
            }

            // 将用户信息附加到请求对象，供后续中间件或路由处理函数使用
            req.user = userRecord;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(403).json({ success: false, error: 'Invalid token' });
            }
            res.status(500).json({ success: false, error: 'Internal server error during authentication' });
        }
    };
}

// 导出预设的中间件
module.exports = {
    tenantAuth: createAuthMiddleware('tenant'),
    adminAuth: createAuthMiddleware('admin'),
    customerAuth: createAuthMiddleware('user') // Assuming 'user' scope corresponds to customer
};