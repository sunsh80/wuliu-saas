const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'db', 'models', 'SystemSetting.js');
let content = fs.readFileSync(filePath, 'utf8');

// 替换导入语句
content = content.replace("const { getDb } = require('../connection');", "const { getRawDb } = require('../connection');");

// 替换所有 getDb() 为 getRawDb()
content = content.replace(/getDb\(\)/g, 'getRawDb()');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ SystemSetting.js 已更新');
