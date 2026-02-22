/**
 * 统一 handler 返回格式：status -> statusCode
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // 替换 return { status: XXX, body: ... } 为 return { statusCode: XXX, body: ... }
  // 使用更精确的正则表达式，只替换返回对象中的 status
  content = content.replace(
    /return\s*\{\s*status:\s*(\d+),/g,
    'return { statusCode: $1,'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ 修复:', path.relative(process.cwd(), file));
    modifiedCount++;
  }
});

console.log(`\n完成：修复了 ${modifiedCount} 个文件`);
