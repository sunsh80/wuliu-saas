// scripts/check-handler-duplicates.js
const path = require('path');
const fs = require('fs');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(path.basename(file, '.js'));
    }
  }
  return fileList;
}

function checkDuplicates() {
  const handlersDir = path.join(__dirname, '..', 'api', 'handlers');
  const operationIds = walk(handlersDir);
  
  if (operationIds.length === 0) {
    console.log('ℹ️ 未发现任何 handler 文件（正常）');
    return;
  }

  const uniqueIds = new Set(operationIds);
  if (operationIds.length !== uniqueIds.size) {
    const seen = new Set();
    const duplicates = [];
    for (const id of operationIds) {
      if (seen.has(id)) {
        duplicates.push(id);
      }
      seen.add(id);
    }
    
    console.error('❌ 发现重复的 operationId（handler 文件名冲突）:');
    [...new Set(duplicates)].forEach(id => console.error(`  - ${id}`));
    process.exit(1);
  } else {
    console.log(`✅ 共检测 ${operationIds.length} 个 handler，无重名`);
  }
}

checkDuplicates();