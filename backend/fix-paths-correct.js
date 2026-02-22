/**
 * 修复 requireAuth 路径
 * 根据目录深度计算正确的路径
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const handlersDir = path.join(__dirname, 'api', 'handlers');
const files = glob.sync('**/*.js', { cwd: handlersDir, absolute: true });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('requireAuth')) return;
  
  // 计算相对路径
  const relativePath = path.relative(path.join(handlersDir, path.dirname(path.relative(handlersDir, file))), path.join(__dirname, 'utils'));
  const requirePath = path.relative(path.dirname(file), path.join(__dirname, 'utils', 'requireAuth')).replace(/\\/g, '/');
  
  console.log(file, '->', requirePath);
  
  // 替换路径
  content = content.replace(
    /require\(['"]\.\.\/(?:\.\.\/)+utils\/requireAuth['"]\)/g,
    `require('${requirePath}')`
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅', path.relative(process.cwd(), file));
});

console.log('\n完成！');
