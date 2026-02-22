/**
 * 为 handler 添加 requireAuth 装饰器
 * 使用方法：node add-auth-to-handler.js <handler 文件路径>
 */
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('用法：node add-auth-to-handler.js <handler 文件路径>');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 添加 requireAuth 导入
const importLine = "const { requireAuth } = require('../../../utils/requireAuth');\n";
content = importLine + '\n' + content;

// 替换 module.exports
content = content.replace(
  /^module\.exports = async \(c\) => \{([\s\S]*?)\n\};$/m,
  `module.exports = requireAuth(async (c) => {$1\n});`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 已添加认证:', filePath);
