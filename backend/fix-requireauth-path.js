/**
 * 修复 handler 中的 requireAuth 路径
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('requireAuth')) return;
  
  // 计算需要上级的层数
  const relativePath = path.relative(handlersDir, file);
  const depth = relativePath.split(path.sep).length;
  const correctPath = '../../../../utils/requireAuth';
  const wrongPath = '../../../utils/requireAuth';
  
  if (content.includes(wrongPath)) {
    content = content.replace(new RegExp(wrongPath.replace(/\//g, '[\\\\/]'), 'g'), correctPath);
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ 已修复:', path.relative(process.cwd(), file));
    fixedCount++;
  }
});

console.log(`\n完成：修复了 ${fixedCount} 个文件`);
