// scripts/fix-empty-handlers.js
const fs = require('fs');
const path = require('path');

const handlersDir = path.resolve(__dirname, '..', 'api', 'handlers');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js')) {
      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (e) {
        console.warn('⚠️ 无法读取:', fullPath);
        continue;
      }

      // 判断是否是“空文件”或只包含注释/空白
      const stripped = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').trim();
      if (stripped === '' || stripped === 'module.exports = {};' || stripped === 'exports = {};') {
        console.log(`🔧 修复空 handler: ${fullPath}`);

        // 提取 operationId 和计算相对路径
        const operationId = path.basename(file, '.js');
        const relativeDir = path.relative(handlersDir, path.dirname(fullPath)).replace(/\\/g, '/');
        const depth = (relativeDir ? relativeDir.split('/').length : 0) + 2; // +2 for api/handlers
        const upLevels = Array(depth).fill('..').join('/');

        const template = `// ${operationId}.js
// 自动修复于 ${new Date().toISOString()}

const { getDb } = require('${upLevels}/db');

/**
 * @param {import('openapi-backend').Context} c
 */
module.exports = async (c) => {
  // TODO: 实现 ${operationId}
  return {
    status: 501,
    body: { success: false, error: 'NOT_IMPLEMENTED' }
  };
};
`;

        fs.writeFileSync(fullPath, template.trim() + '\n', 'utf8');
      }
    }
  }
}

console.log('🔍 开始扫描并修复空 handler 文件...');
walk(handlersDir);
console.log('✅ 修复完成！现在所有 .js 文件都是合法函数。');