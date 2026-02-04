// backend/middleware/openapi.js
const { OpenAPIBackend } = require('openapi-backend');
const addFormats = require('ajv-formats');
const path = require('path');
const { autoRegisterHandlers } = require('../middleware/handlerLoader');
const config = require('../config');

class OpenApiMiddleware {
  constructor() {
    // ✅ 修正路径：从 backend 根目录加载 openapi.yaml
    this.api = new OpenAPIBackend({
      definition: path.resolve(__dirname, '..', config.openapi.definition),
      strict: config.openapi.strict,
      validate: config.openapi.validate,
      ajvOpts: { strict: false, plugins: [addFormats] }
    });
  }

  async initialize(securityHandler) {
    this.api.registerSecurityHandler('TenantSessionAuth', securityHandler);
    this.api.register('notFound', (c) => ({ status: 404, body: { message: 'API_NOT_FOUND' } }));
    this.api.register('validationFail', (c) => ({ status: 400, body: { message: 'Bad Request', errors: c.validation.errors } }));

    autoRegisterHandlers(this.api);
    await this.api.init();
   // --- 添加以下代码块用于调试 ---
    console.log('--- DEBUG: OpenAPI Document Loaded ---');
    // 打印所有路径
    console.log('All Paths in Document:');
    for (const [path, pathItem] of Object.entries(this.api.definition.paths)) {
        console.log(`  Path: ${path}`);
        // 检查是否存在 POST 方法
        if (pathItem.post) {
            console.log(`    -> Method: POST`);
            console.log(`       OperationId: ${pathItem.post.operationId}`);
            console.log(`       Has Parameters: ${!!pathItem.parameters || !!(pathItem.post.parameters && pathItem.post.parameters.length > 0)}`);
            if (pathItem.post.parameters) {
                console.log(`       Parameters:`, pathItem.post.parameters.map(p => p.name + (p.required ? '(required)' : '') + ` [${p.in}]`));
            }
        }
    }
    console.log('--- END DEBUG ---');
    // --- 结束添加 ---

    console.log('🔧 OpenAPI中间件初始化完成');
    this.printRegisteredPaths();
    return this.api;
  }

  printRegisteredPaths() {
    console.log('\n📋 已注册的 OpenAPI 路径:');
    const paths = Object.keys(this.api.definition.paths || {});
    paths.forEach(path => {
      const methods = Object.keys(this.api.definition.paths[path] || {});
      methods.forEach(method => {
        const op = this.api.definition.paths[path][method];
        console.log(` ${method.toUpperCase()} ${path} -> ${op.operationId}`);
      });
    });
  }

  apiHandler() {
    return async (req, res, next) => {
      if (!req.path.startsWith('/api')) return next();

      if (true) { // 确保日志始终打印
        console.log('\n🌐 [API REQUEST DETAIL]');
        console.log(' → Method:', req.method);
        console.log(' → Path:', req.path);
        console.log(' → Session ID:', req.sessionID);
        console.log(' → Session:', { userId: req.session?.userId, tenantId: req.session?.tenantId, exists: !!req.session });
        console.log(' → Raw Request Headers (for Cookie):', req.headers);
      }

      try {
        // *** 在调用 api.handleRequest 之前，再次确认 req.session 状态 ***
        console.log('🔍 [DEBUG] Before api.handleRequest - req.session:', req.session);
        console.log('🔍 [DEBUG] Before api.handleRequest - req.session.userId:', req.session?.userId);

        // *** 添加日志，查看 openapi-backend 如何解析此请求 ***
        console.log('🔍 [DEBUG] About to call handleRequest for:', req.method, req.path);
        const matchedOperation = this.api.getOperation(req);
        if (matchedOperation) {
           console.log(' → Matched Operation ID:', matchedOperation.operationId);
           console.log(' → Matched Operation Security Definition:', matchedOperation.security);
        } else {
           console.log(' ❌ No matching operation found for:', req.method, req.path);
        }

        const response = await this.api.handleRequest(req);

        // ✅ 修复：同时支持 admin 登录和租户登录的 session 设置
        if ((req.path === '/api/tenant-web/login' || req.path === '/api/admin/login') && response.body?.success) {
          if (response.body.userId && req.session) {
            req.session.userId = response.body.userId;
            // 租户登录有 tenant_id，admin 登录可能没有
            if (response.body.data?.tenant_id !== undefined) {
              req.session.tenantId = response.body.data.tenant_id;
            }
            console.log(' → 🔐 登录成功，设置 session:', { userId: req.session.userId, tenantId: req.session.tenantId });
          }
        }

        return res.status(response.statusCode || 200).json(response.body);
      } catch (err) {
        console.error('💥 [API 处理异常]:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
        }
      }
    };
  }
}

module.exports = OpenApiMiddleware;