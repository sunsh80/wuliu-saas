// api/handlers/auth/adminLogin.js
console.log('Trying to load db from:', __dirname);
const { getDb } = require('../../../../db/index.js');
const { bcrypt, jwt } = require('../../../../utils');

// ✅ 添加这个日志，确认函数被调用
console.log("🚀 adminLogin.js handler function is executing!");

module.exports = async (c) => {
    console.log("🎯 Inside adminLogin handler, processing request..."); // <--- 新增日志
    const { username, password } = c.request.body;

    console.log("👤 Received credentials:", { username, password: "***" }); // <--- 新增日志，隐藏密码

    if (!username || !password) {
        console.log("❌ Missing username or password"); // <--- 新增日志
        return {
            status: 400,
            body: {
                success: false,
                error: 'Username and password are required'
            }
        };
    }

    const db = getDb();

    console.log("🔍 Executing database query for username:", username); // <--- 新增日志
    const user = await db.get(
        `SELECT id, username, email, name, role, type, password_hash, organization_id, organization_name, organization_type, is_active
         FROM users
         WHERE username = ? AND user_type = 'admin_user'`,
        [username]
    );

    console.log("💾 Query result:", user); // <--- 新增日志

    if (!user) {
        console.log("❌ User not found or does not match criteria (username or user_type)"); // <--- 新增日志
        return {
            status: 401,
            body: {
                success: false,
                error: 'Invalid credentials'
            }
        };
    }

    if (!user.is_active) {
        console.log("❌ User found but is not active"); // <--- 新增日志
        return {
            status: 401,
            body: {
                success: false,
                error: 'Invalid credentials'
            }
        };
    }

    console.log("🔒 Comparing provided password with stored hash..."); // <--- 新增日志
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log("🔑 Password comparison result:", passwordMatch); // <--- 新增日志

    if (!passwordMatch) {
        console.log("❌ Password mismatch"); // <--- 新增日志
        return {
            status: 401,
            body: {
                success: false,
                error: 'Invalid credentials'
            }
        };
    }

    console.log("✅ User authenticated successfully, generating token..."); // <--- 新增日志
    // 生成 JWT Token
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            // phone: user.phone, // 假设 user 对象没有 phone
            role: user.role
        },
        process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
        { expiresIn: '24h' }
    );

    return {
        status: 200,
        body: {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    // phone: user.phone, // 假设 user 对象没有 phone
                    name: user.name,
                    role: user.role,
                    type: user.type,
                    organization_id: user.organization_id
                }
            }
        }
    };
};