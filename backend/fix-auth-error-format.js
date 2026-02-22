const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'middleware', 'auth.js');
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有 return [401, ...] 为 throw { statusCode: 401, body: ... }
content = content.replace(
  /return \[401, \{ success: false, error: 'UNAUTHORIZED' \}\];/g,
  `throw {
    statusCode: 401,
    body: {
      success: false,
      error: 'UNAUTHORIZED',
      message: '未授权访问，请先登录'
    }
  };`
);

// 替换 return [401, { success: false, error: 'USER_NOT_FOUND' }]
content = content.replace(
  /return \[401, \{ success: false, error: 'USER_NOT_FOUND' \}\];/g,
  `throw {
    statusCode: 401,
    body: {
      success: false,
      error: 'USER_NOT_FOUND',
      message: '用户不存在'
    }
  };`
);

// 替换 return [500, ...]
content = content.replace(
  /return \[500, \{ success: false, error: 'INTERNAL_ERROR' \}\];/g,
  `throw {
    statusCode: 500,
    body: {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '内部服务器错误'
    }
  };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ auth.js 已更新');
