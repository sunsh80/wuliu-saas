const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'middleware', 'auth.js');
let content = fs.readFileSync(filePath, 'utf8');

// 统一所有认证失败返回 false（让 openapi-backend 的 unauthorized handler 处理）
content = content.replace(
  /return\s*\{\s*statusCode:\s*401,\s*body:\s*\{\s*success:\s*false,\s*error:\s*'UNAUTHORIZED',\s*message:\s*'未授权访问，请先登录'\s*\}\s*\};/g,
  'return false;'
);

content = content.replace(
  /return\s*\{\s*statusCode:\s*401,\s*body:\s*\{\s*success:\s*false,\s*error:\s*'UNAUTHORIZED',\s*message:\s*'Token 无效'\s*\}\s*\};/g,
  'return false;'
);

content = content.replace(
  /return\s*\{\s*statusCode:\s*401,\s*body:\s*\{\s*success:\s*false,\s*error:\s*'USER_NOT_FOUND',\s*message:\s*'用户不存在'\s*\}\s*\};/g,
  'return false;'
);

content = content.replace(
  /return\s*\{\s*statusCode:\s*500,\s*body:\s*\{\s*success:\s*false,\s*error:\s*'INTERNAL_ERROR',\s*message:\s*'数据库查询失败'\s*\}\s*\};/g,
  'return false;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ auth.js 已统一为返回 false');
