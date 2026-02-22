const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'middleware', 'auth.js');
let content = fs.readFileSync(filePath, 'utf8');

// 替换 return false; 为返回完整的响应对象
// 认证失败的情况
content = content.replace(
  /console\.log\(' → ❌ 认证失败：没有用户 ID \(session 或 token\)'\);\s*return false;/g,
  `console.log(' → ❌ 认证失败：没有用户 ID (session 或 token)');
        return {
          statusCode: 401,
          body: {
            success: false,
            error: 'UNAUTHORIZED',
            message: '未授权访问，请先登录'
          }
        };`
);

// 用户不存在的情况
content = content.replace(
  /console\.log\(' → ❌ 用户不存在'\);\s*return false;/g,
  `console.log(' → ❌ 用户不存在');
        return {
          statusCode: 401,
          body: {
            success: false,
            error: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        };`
);

// JWT 验证失败的情况
content = content.replace(
  /console\.log\(' → ❌ JWT Token 验证失败:', err\.message\);\s*return false;/g,
  `console.log(' → ❌ JWT Token 验证失败:', err.message);
        return {
          statusCode: 401,
          body: {
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Token 无效'
          }
        };`
);

// 数据库查询失败的情况
content = content.replace(
  /console\.error\(' → 🚨 数据库查询失败:', error\.message\);\s*return false;/g,
  `console.error(' → 🚨 数据库查询失败:', error.message);
        return {
          statusCode: 500,
          body: {
            success: false,
            error: 'INTERNAL_ERROR',
            message: '数据库查询失败'
          }
        };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ auth.js 已更新为返回响应对象');
