/**
 * 清理 handler 中的认证检查代码
 * 因为认证应该由 OpenAPI 安全处理器统一处理
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');

// 查找所有 handler 文件
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // 移除认证检查代码块
  content = content.replace(
    /\/\/ 认证检查：如果没有 c\.context，说明未认证\s*if\s*\(!c\.context\s*\|\|\s*!c\.context\.id\)\s*\{\s*return\s*\{\s*statusCode:\s*401,\s*body:\s*\{\s*success:\s*false,\s*error:\s*'UNAUTHORIZED',\s*message:\s*'未授权访问，请先登录'\s*\}\s*\};\s*\}\s*/g,
    ''
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ 清理:', path.relative(process.cwd(), file));
    modifiedCount++;
  }
});

console.log(`\n完成：清理了 ${modifiedCount} 个文件`);
