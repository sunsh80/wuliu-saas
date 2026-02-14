// backend/middleware/handlerLoader.js
const path = require('path');
const fs = require('fs');

function autoRegisterHandlers(api) {
  const handlersDir = path.join(__dirname, '..', 'api', 'handlers');
  if (!fs.existsSync(handlersDir)) {
    console.warn('⚠️ handlers 目录不存在:', handlersDir);
    return;
  }

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.js')) {
        const operationId = path.basename(file, '.js');
        let handler;

        // 🔍 关键：包裹 require 调用，捕获被加载文件的语法错误
        try {
          handler = require(fullPath);
        } catch (err) {
          console.error(`💥 [FATAL] 加载 Handler 失败！`);
          console.error(`   文件路径: ${fullPath}`);
          console.error(`   错误信息: ${err.message}`);
          console.error(`   请检查该文件是否存在语法错误（如中文符号、多余标点等）`);
          process.exit(1); // 立即退出，避免后续不可预知行为
        }

        if (typeof handler !== 'function') {
          console.error(`❌ Handler "${operationId}" 必须导出一个函数！`);
          console.error(`   文件路径: ${fullPath}`);
          process.exit(1);
        }

        api.register(operationId, handler);
        console.log(`✅ 注册 handler: ${operationId} -> ${fullPath}`);
      }
    }
  }

  walk(handlersDir);
}

module.exports = { autoRegisterHandlers };