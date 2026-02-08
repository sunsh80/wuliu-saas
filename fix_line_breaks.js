// 修复openapi.yaml文件中的换行错误
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 修复openapi.yaml文件中的换行错误...');

// 修复被错误换行的enum定义
content = content.replace(/enum: \[created, pending, pending_claim, claimed, quoted, awarded, dispatched, in_transit, delivered, c\r?\nan?c?e?l?l?e?d?\]/g, 
                         'enum: [created, pending, pending_claim, claimed, quoted, awarded, dispatched, in_transit, delivered, cancelled]');

// 修复可能的其他换行问题
content = content.replace(/enum: \[customer, carrier, c\r?\nan?c?e?l?l?a?t?i?o?n?\]/g, 
                         'enum: [customer, carrier]');

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ openapi.yaml 文件中的换行错误已修复');