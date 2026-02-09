const fs = require('fs');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');

  // 计算getAdminProfile出现的次数
  const matches = content.match(/operationId:\s*getAdminProfile/g);
  console.log('getAdminProfile operationId 出现次数:', matches ? matches.length : 0);

  if (matches && matches.length === 1) {
    console.log('✅ 修复成功：getAdminProfile 操作ID现在唯一了！');
  } else if (matches && matches.length > 1) {
    console.log('❌ 仍有重复的 getAdminProfile 操作ID');
  } else {
    console.log('❌ 没有找到 getAdminProfile 操作ID');
  }
} catch (error) {
  console.error('读取文件错误:', error.message);
}