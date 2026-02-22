const fs = require('fs');

// 需要 4 层路径的文件（在子目录中）
const deepFiles = [
  'backend/api/handlers/carrier/order/claimCarrierOrder.js'
];

deepFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /require\(['"]\.\.\/(?:\.\.\/)+utils\/requireAuth['"]\)/g,
    "require('../../../../utils/requireAuth')"
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ (4 层)', file);
});

console.log('\n完成！');
