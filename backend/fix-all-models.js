const fs = require('fs');
const path = require('path');

const models = [
  'ServiceProvider.js',
  'Commission.js',
  'VehicleTracking.js',
  'Violation.js'
];

const modelsDir = path.join(__dirname, 'db', 'models');

models.forEach(model => {
  const filePath = path.join(modelsDir, model);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换导入语句
  content = content.replace("const { getDb } = require('../connection');", "const { getRawDb } = require('../connection');");
  
  // 替换所有 getDb() 为 getRawDb()
  content = content.replace(/getDb\(\)/g, 'getRawDb()');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅', model, '已更新');
});

console.log('\n完成！');
