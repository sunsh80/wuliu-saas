# 后端服务启动错误记录

## 错误信息
```
💥 服务启动失败: {
  stack: 'ParserError: Error parsing c:/Users/Administrator/Desktop/wuliu_project/backend/openapi.yaml: bad indentation of a mapping entry (48:3)\n' +
    '\n' +
    ' 45 |   - name: matching\n' +
    ' 46 |     description: 智能匹配（新增，可选使用）\n' +
    ' 47 | \n' +
    ' 48 |   securitySchemes:\n' +
    '--------^\n' +
    ' 49 |     AdminSessionAuth:\n' +
    ' 50 |       type: apiKey\n' +
    '    at Object.parse (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\parsers\\yaml.js:44:23)\n' +
    '    at getResult (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\util\\plugins.js:115:22)\n' +
    '    at runNextPlugin (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\util\\plugins.js:64:32)\n' +
    '    at C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\util\\plugins.js:55:9\n' +
    '    at new Promise (<anonymous>)\n' +
    '    at Object.run (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\util\\plugins.js:54:12)\n' +
    '    at parseFile (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\parse.js:140:38)\n' +
    '    at parse (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\@apidevtools\\json-schema-ref-parser\\dist\\lib\\parse.js:66:30)\n' +
    '    at async OpenAPIBackend.loadDocument (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\openapi-backend\\backend.js:205:26)\n' +
    '    at async OpenAPIBackend.init (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\node_modules\\openapi-backend\\backend.js:186:18)\n' +
    '    at async OpenApiMiddleware.initialize (C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\middleware\\openapi.js:25:5)\n' +
    '    at async startServer (C:\\Users\Administrator\\Desktop\\wuliu_project\\backend\\server.js:50:17)'
}
```

## 问题分析
1. OpenAPI规范文件（openapi.yaml）中存在缩进错误
2. 在第48行，`securitySchemes:` 的缩进不正确
3. 还有22个API端点的operationId在OpenAPI规范中缺失：
   - claimCarrierOrder
   - completeCarrierOrder
   - listCarrierOrders
   - startDelivery
   - submitCarrierQuote
   - awardOrderToCarrier
   - bindOrderToCustomer
   - deleteCustomerOrder
   - getCustomerOrder
   - getOrderQuotes
   - updateCustomerOrder
   - healthCheck
   - fetchPublicOrder
   - createFirstAdmin
   - getSetupStatus
   - applyPcTenant
   - getTenantProfile
   - getTenantRoles
   - loginTenantWeb
   - registerTenantWeb
   - listPendingOrders
   - listCarrierQuotes

## 解决方案
需要修复openapi.yaml文件中的缩进错误，并添加所有缺失的API端点定义。

## 状态
- 当前后端服务无法启动
- 需要在明天进行修复
- 修复后需要验证所有API端点是否正常工作