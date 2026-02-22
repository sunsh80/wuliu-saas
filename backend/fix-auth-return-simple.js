const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'middleware', 'auth.js');
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有 return [401, ...] 为 return false;
// openapi-backend 的安全处理器返回 false 表示认证失败
content = content.replace(
  /return \[401, \{ success: false, error: 'UNAUTHORIZED' \}\];/g,
  'return false;'
);

content = content.replace(
  /return \[401, \{ success: false, error: 'USER_NOT_FOUND' \}\];/g,
  'return false;'
);

content = content.replace(
  /return \[500, \{ success: false, error: 'INTERNAL_ERROR' \}\];/g,
  'return false;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ auth.js 已更新为返回 false');
