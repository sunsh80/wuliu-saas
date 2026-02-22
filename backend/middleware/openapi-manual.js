// backend/middleware/openapi.js
const { OpenAPIBackend } = require('openapi-backend');
const addFormats = require('ajv-formats');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { autoRegisterHandlers } = require('../middleware/handlerLoader');
const config = require('../config');

class OpenApiMiddleware {
  constructor() {
    // ✅ 手动加载 openapi.yaml 文件
    const openapiPath = path.resolve(__dirname, '..', config.openapi.definition);
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const openapiDoc = yaml.load(openapiContent);

    this.api = new OpenAPIBackend({
      definition: openapiDoc,
      strict: config.openapi.strict,
      validate: config.openapi.validate,
      ajvOpts: { strict: false, plugins: [addFormats] }
    });
  }

  async initialize(securityHandler) {
    this.api.register('notFound', (c) => {
      console.log(' → [notFound] 调用');
      return { status: 404, body: { message: 'API_NOT_FOUND' } };
    });
    this.api.register('validationFail', (c) => {
      console.error('❌ [OpenAPI 验证失败]:', c.operation?.operationId);
      console.error('  → Path:', c.request.path);
      console.error('  → Method:', c.request.method);
      console.error('  → Errors:', JSON.stringify(c.validation.errors, null, 2));
      return { status: 400, body: { message: 'Bad Request', errors: c.validation.errors } };
    });

    autoRegisterHandlers(this.api);
    await this.api.init();

    console.log('✅ OpenAPI 处理器注册完成');

    if (!this.api.definition) {
      console.error('❌ 严重错误：openapi.yaml 文件加载失败！');
      throw new Error('openapi.yaml 文件加载失败');
    }
    if (!this.api.definition.paths) {
      this.api.definition.paths = {};
      console.log('⚠️ 警告：openapi.yaml 中缺少 paths 字段');
    }

    this.api.registerSecurityHandler('TenantSessionAuth', securityHandler);
    this.api.registerSecurityHandler('AdminSessionAuth', securityHandler);

    console.log('🔧 OpenAPI 中间件初始化完成');
    return this.api;
  }

  apiHandler() {
    return async (req, res, next) => {
      if (!req.path.startsWith('/api')) return next();

      try {
        // 创建 context 对象
        const c = {
          request: req,
          response: res,
          operation: this.api.operationForRequest(req)
        };

        // 手动执行安全认证
        const security = c.operation?.security;
        if (security && security.length > 0) {
          console.log('🛡️ [手动安全检查]:', c.operation?.operationId);
          
          let authenticated = false;
          for (const sec of security) {
            const schemeName = Object.keys(sec)[0];
            const handler = this.api.securityHandlers?.get(schemeName);
            
            if (handler) {
              try {
                const result = await handler(c);
                if (result === true || (result && result.statusCode === undefined)) {
                  // 认证成功（返回 true 或设置了 c.context）
                  authenticated = true;
                  break;
                } else if (result && result.statusCode) {
                  // 返回了响应对象，直接返回
                  console.log(' → 认证返回响应:', result.statusCode);
                  return res.status(result.statusCode).json(result.body);
                }
                // 返回 false，继续尝试下一个安全方案
              } catch (err) {
                console.log(' → 认证异常:', err.message);
                if (err.statusCode && err.body) {
                  return res.status(err.statusCode).json(err.body);
                }
              }
            }
          }
          
          if (!authenticated) {
            console.log(' → ❌ 认证失败，返回 401');
            return res.status(401).json({
              statusCode: 401,
              body: {
                success: false,
                error: 'UNAUTHORIZED',
                message: '未授权访问，请先登录'
              }
            });
          }
        }

        // 认证通过，继续处理请求
        const response = await this.api.handleRequest(req);

        // 处理登录 session
        if ((req.path === '/api/tenant-web/login' || req.path === '/api/admin/login') && response.body?.success) {
          if (response.body.userId && req.session) {
            req.session.userId = response.body.userId;
            if (response.body.data?.tenant_id !== undefined) {
              req.session.tenantId = response.body.data.tenant_id;
            }
          }
        }

        return res.status(response.statusCode || 200).json(response.body);
      } catch (err) {
        if (err.statusCode && err.body) {
          console.log(' → 捕获认证错误:', err.statusCode, err.body);
          return res.status(err.statusCode).json(err.body);
        }

        console.error('💥 [API 处理异常]:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
        }
      }
    };
  }
}

module.exports = OpenApiMiddleware;
