const { getDb } = require('../../../db');
const bcrypt = require('bcrypt');

module.exports = async (c) => {
  try {
    console.log('🔐 开始创建首个平台管理员...');
    console.log('📥 请求数据:', JSON.stringify(c.request.body, null, 2));
    
    const { username, password, email, platform_name, license_key } = c.request.body;
    
    // 参数验证
    if (!username || !password || !email || !platform_name) {
      console.log('❌ 必需参数缺失');
      return {
        statusCode: 400,
        body: {
          error: 'MISSING_REQUIRED_FIELDS',
          message: '用户名、密码、邮箱和平台名称都是必需的'
        }
      };
    }
    
    if (typeof username !== 'string' || username.length < 3) {
      console.log('❌ 用户名格式无效');
      return {
        statusCode: 400,
        body: {
          error: 'INVALID_USERNAME',
          message: '用户名至少需要3个字符'
        }
      };
    }
    
    if (typeof password !== 'string' || password.length < 8) {
      console.log('❌ 密码格式无效');
      return {
        statusCode: 400,
        body: {
          error: 'INVALID_PASSWORD',
          message: '密码至少需要8个字符'
        }
      };
    }
    
    // 验证邮箱格式（简单验证）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ 邮箱格式无效');
      return {
        statusCode: 400,
        body: {
          error: 'INVALID_EMAIL',
          message: '邮箱格式不正确'
        }
      };
    }
    
    const db = getDb();
    
    // 检查是否已存在管理员（防止重复初始化）
    const existingAdmin = await db.get(`
      SELECT id FROM users 
      WHERE role = 'admin' OR roles LIKE '%admin%'
    `);
    
    if (existingAdmin) {
      console.log('❌ 平台已被初始化，无法创建更多管理员');
      return {
        statusCode: 400,
        body: {
          error: 'PLATFORM_ALREADY_INITIALIZED',
          message: '平台已初始化，无法重复创建管理员'
        }
      };
    }
    
    // 检查用户名或邮箱是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      console.log('❌ 用户名或邮箱已存在');
      return {
        statusCode: 409,
        body: {
          error: 'USERNAME_OR_EMAIL_EXISTS',
          message: '用户名或邮箱已存在'
        }
      };
    }
    
    // 加密密码
    console.log('🔑 加密密码...');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // 开始数据库事务
    console.log('💾 开始保存管理员信息...');
    
    // 创建管理员用户
    const createUserResult = await db.run(
      `INSERT INTO users (
        username, email, password_hash, name, role, roles, type,
        tenant_id, user_type, is_active, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        username,
        email,
        password_hash,
        username, // name
        'admin', // role
        JSON.stringify(['admin']), // roles - 存储为JSON数组
        'system', // type
        null, // tenant_id
        'admin', // user_type
        1, // is_active
        'active' // status
      ]
    );
    
    console.log('✅ 管理员用户创建成功，ID:', createUserResult.lastID);
    
    // 创建组织记录（如果不存在）
    try {
      await db.run(
        `INSERT OR IGNORE INTO organizations (name, type, contact_email, created_at, updated_at) 
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [platform_name, 'admin', email]
      );
    } catch (orgErr) {
      console.log('⚠️ 创建组织记录时出现错误（可能已存在）:', orgErr.message);
    }
    
    console.log('🔐 首个平台管理员创建成功');
    
    return {
      statusCode: 201,
      body: {
        success: true,
        message: '平台初始化成功',
        adminId: createUserResult.lastID
      }
    };
  } catch (error) {
    console.error('💥 创建首个管理员时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    };
  }
};