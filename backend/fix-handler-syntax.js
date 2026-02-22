/**
 * 修复 handler 文件末尾的语法错误
 * 将 `};` 替换为 `});`
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 只处理有 requireAuth 的文件
  if (!content.includes('requireAuth')) return;
  
  // 检查是否需要修复
  if (content.match(/module\.exports = requireAuth\(async \(c\) => \{[\s\S]*?\n\};$/m)) {
    // 替换末尾的 }; 为 });
    content = content.replace(/\n\};$/m, '\n});');
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅', path.relative(process.cwd(), file));
    fixedCount++;
  }
});

console.log(`\n完成：修复了 ${fixedCount} 个文件`);
