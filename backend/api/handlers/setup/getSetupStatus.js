const { getDb } = require('../../../db');

module.exports = async (c) => {
  try {
    console.log('🔍 检查平台初始化状态...');
    
    const db = getDb();
    
    // 检查管理员是否存在（通常在 organizations 表中类型为 'admin' 或者在 users 表中有管理员角色）
    let adminExists = false;
    
    try {
      // 尝试查询管理员用户
      const adminUser = await db.get(`
        SELECT id FROM users 
        WHERE role = 'admin' OR roles LIKE '%admin%' 
        LIMIT 1
      `);
      
      if (adminUser && adminUser.id) {
        adminExists = true;
      } else {
        // 如果在 users 表中没找到，检查 organizations 表
        const adminOrg = await db.get(`
          SELECT id FROM organizations 
          WHERE type = 'admin' 
          LIMIT 1
        `);
        
        adminExists = !!adminOrg;
      }
    } catch (queryErr) {
      console.log('⚠️ 查询管理员时出现错误，可能表还未初始化:', queryErr.message);
      // 如果查询失败，我们认为平台未初始化
      adminExists = false;
    }

    console.log('✅ 平台初始化状态:', adminExists ? '已初始化' : '未初始化');
    
    return {
      statusCode: 200,
      body: {
        initialized: adminExists
      }
    };
  } catch (error) {
    console.error('💥 检查平台初始化状态时发生错误:', error);
    return {
      statusCode: 500,
      body: {
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    };
  }
};