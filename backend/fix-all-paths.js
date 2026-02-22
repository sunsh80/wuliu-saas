/**
 * 修复 requireAuth 路径 - 全部改为 3 层
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('requireAuth')) return;
  
  // 替换所有路径为 3 层
  content = content.replace(
    /require\(['"]\.\.\/(?:\.\.\/)+utils\/requireAuth['"]\)/g,
    "require('../../../utils/requireAuth')"
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅', path.relative(process.cwd(), file));
});

console.log('\n完成！');
