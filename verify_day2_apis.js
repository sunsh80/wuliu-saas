const fs = require('fs');
const yaml = require('js-yaml');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  const spec = yaml.load(content);
  console.log('✅ YAML格式有效');
  console.log('✅ OpenAPI规范解析成功');

  // 检查DAY 2新增的API端点
  const hasGetOrderQuote = !!(spec.paths['/api/order/quote'] && spec.paths['/api/order/quote'].post && spec.paths['/api/order/quote'].post.operationId === 'getOrderQuote');

  console.log('✅ getOrderQuote操作存在:', hasGetOrderQuote);

  if (hasGetOrderQuote) {
    console.log('详细信息:');
    console.log('- 路径: /api/order/quote');
    console.log('- 方法: POST');
    console.log('- OperationId: getOrderQuote');
    console.log('- 标签: ', spec.paths['/api/order/quote'].post.tags);
    console.log('- 摘要: ', spec.paths['/api/order/quote'].post.summary);
    console.log('- 请求体参数: ', Object.keys(spec.paths['/api/order/quote'].post.requestBody.content['application/json'].schema.properties || {}));
    console.log('- 响应定义: ', Object.keys(spec.paths['/api/order/quote'].post.responses));
  }

  // 检查相关的schema定义
  const hasCarrierQuoteSchema = !!spec.components.schemas.CarrierQuote;
  const hasOrderDetailsSchema = !!spec.components.schemas.OrderDetails;
  const hasOrderQuoteSchema = !!spec.components.schemas.OrderQuote;

  console.log('✅ CarrierQuote Schema定义存在:', hasCarrierQuoteSchema);
  console.log('✅ OrderDetails Schema定义存在:', hasOrderDetailsSchema);
  console.log('✅ OrderQuote Schema定义存在:', hasOrderQuoteSchema);
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
}