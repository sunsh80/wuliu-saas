const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

try {
  const yamlContent = fs.readFileSync(path.join(__dirname, 'backend/openapi.yaml'), 'utf8');
  console.log('YAML文件读取成功，长度:', yamlContent.length);
  
  const doc = yaml.load(yamlContent);
  console.log('YAML解析成功');
  
  console.log('检查 /api/admin/vehicle-models 路径定义:');
  const vehicleModelsPath = doc.paths['/api/admin/vehicle-models'];
  if (vehicleModelsPath) {
    console.log('GET方法存在:', !!vehicleModelsPath.get);
    console.log('POST方法存在:', !!vehicleModelsPath.post);
    if (vehicleModelsPath.post) {
      console.log('POST operationId:', vehicleModelsPath.post.operationId);
    }
  } else {
    console.log('路径 /api/admin/vehicle-models 不存在');
    console.log('所有路径:', Object.keys(doc.paths || {}));
  }
} catch (e) {
  console.error('错误:', e.message);
}