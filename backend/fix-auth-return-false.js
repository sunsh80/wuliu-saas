const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'middleware', 'auth.js');
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有 throw { statusCode: 401, ... } 为 return false
content = content.replace(
  /throw \{\s*statusCode: 401,\s*body:\s*\{\s*success: false,\s*error: 'UNAUTHORIZED',\s*message: '未授权访问，请先登录'\s*\}\s*\};/g,
  `return false;`
);

// 替换 throw { statusCode: 401, ... USER_NOT_FOUND }
content = content.replace(
  /throw \{\s*statusCode: 401,\s*body:\s*\{\s*success: false,\s*error: 'USER_NOT_FOUND',\s*message: '用户不存在'\s*\}\s*\};/g,
  `return false;`
);

// 替换 throw { statusCode: 500, ... }
content = content.replace(
  /throw \{\s*statusCode: 500,\s*body:\s*\{\s*success: false,\s*error: 'INTERNAL_ERROR',\s*message: '内部服务器错误'\s*\}\s*\};/g,
  `return false;`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ auth.js 已更新为返回 false');
