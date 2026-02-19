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
    // ✅ 手动加载 openapi.yaml 文件（避免 openapi-backend 自动加载时 definition 为 undefined 的问题）
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
    this.api.register('notFound', (c) => ({ status: 404, body: { message: 'API_NOT_FOUND' } }));
    this.api.register('validationFail', (c) => ({ status: 400, body: { message: 'Bad Request', errors: c.validation.errors } }));

    autoRegisterHandlers(this.api);
    await this.api.init();

    // init() 后才能访问 definition
    if (!this.api.definition) {
      console.error('❌ 严重错误：openapi.yaml 文件加载失败！');
      throw new Error('openapi.yaml 文件加载失败，请检查文件路径和内容');
    }
    if (!this.api.definition.paths) {
      this.api.definition.paths = {};
      console.log('⚠️ 警告：openapi.yaml 中缺少 paths 字段，已自动添加空对象');
    }

    this.api.registerSecurityHandler('TenantSessionAuth', securityHandler);

    console.log('🔧 OpenAPI 中间件初始化完成');
    return this.api;
  }

  apiHandler() {
    return async (req, res, next) => {
      if (!req.path.startsWith('/api')) return next();

      try {
        const response = await this.api.handleRequest(req);

        // ✅ 修复：同时支持 admin 登录和租户登录的 session 设置
        if ((req.path === '/api/tenant-web/login' || req.path === '/api/admin/login') && response.body?.success) {
          if (response.body.userId && req.session) {
            req.session.userId = response.body.userId;
            // 租户登录有 tenant_id，admin 登录可能没有
            if (response.body.data?.tenant_id !== undefined) {
              req.session.tenantId = response.body.data.tenant_id;
            }
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
