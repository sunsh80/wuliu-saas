const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  
  // 检查getAdminProfile操作是否存在
  let getAdminProfileCount = 0;
  for (const [path, pathObj] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (operation.operationId === 'getAdminProfile') {
        console.log(`✅ 找到 getAdminProfile 操作: ${method.toUpperCase()} ${path}`);
        getAdminProfileCount++;
      }
    }
  }
  
  console.log(`\n📊 统计: 共找到 ${getAdminProfileCount} 个 getAdminProfile 操作`);
  if (getAdminProfileCount === 1) {
    console.log('✅ getAdminProfile 操作ID唯一，修复成功！');
  } else {
    console.log('❌ 仍有问题：getAdminProfile 操作ID不唯一');
  }
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}