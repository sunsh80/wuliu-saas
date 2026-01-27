# 项目结构说明

## 目录结构
```
wuliu_project/
├── backend/                 # 后端代码
│   ├── api/                 # API端点处理程序
│   │   └── handlers/        # 各体的API处理函数
│   ├── config/              # 配置文件
│   ├── db/                  # 数据库相关代码
│   │   ├── schema.js        # 数据库模式定义
│   │   └── index.js         # 数据库连接管理
│   ├── middleware/          # 中间件
│   │   ├── validation.js    # 验证中间件
│   │   ├── api-validator.js # API验证器
│   │   └── openapi.js       # OpenAPI中间件
│   ├── models/              # 数据模型
│   ├── services/            # 业务服务
│   ├── utils/               # 工用函数
│   ├── server.js            # 服务器启动文件
│   └── openapi.yaml         # API规范文件
├── wx-program/              # 微信小程序代码
│   ├── pages/               # 页面
│   ├── utils/               # 工用函数
│   │   └── validation-rules.js # 验证规则库
│   └── app.js               # 小程序入口
├── validation-rules.js      # 共享验证规则库
├── validation-spec.md       # 验证规范文档
├── validation-metadata.json # 验证元数据
├── db-field-mapping.json    # 数据库字段映射
├── .ai-config.json          # AI编程配置
├── ai-comment-guidelines.md # AI注释规范
├── code-generation-template.hbs # 代码生成模板
└── check-consistency.js     # 一致性检查脚本
```

## 核心组件说明

### 1. 验证系统
- `validation-rules.js` - 共享验证规则库
- `wx-program/utils/validation-rules.js` - 小程序验证规则库
- `backend/middleware/validation.js` - 验证中间件
- `backend/middleware/api-validator.js` - API验证器
- `validation-metadata.json` - 验证规则元数据
- `check-consistency.js` - 一致性检查脚本

### 2. API规范
- `backend/openapi.yaml` - OpenAPI规范文件
- `backend/middleware/openapi.js` - OpenAPI中间件

### 3. 数据库
- `backend/db/schema.js` - 数据库模式定义
- `backend/db/index.js` - 数据库连接管理

### 4. AI编程支持
- `.ai-config.json` - AI配置文件
- `ai-comment-guidelines.md` - 注释规范
- `code-generation-template.hbs` - 代码生成模板

## 数据流向

1. **输入验证**: API请求 → API验证器 → 验证中间件 → 业务逻辑
2. **数据存储**: 业务逻辑 → 数据库模型 → 数据库
3. **响应返回**: 业务逻辑 → API响应 → 客户端

## 验证规则应用层级

1. **前端验证**: 微信小程序使用验证库进行即时验证
2. **API验证**: API层使用验证中间件进行请求验证
3. **业务验证**: 业务逻辑层进行业务规则验证
4. **数据库约束**: 数据库层面的基础约束

## 开发规范

1. **验证规则**: 所验证规则必须在validation-metadata.json中定义
2. **注释规范**: 遌循ai-comment-guidelines.md中的规范
3. **代码生成**: 使用code-generation-template.hbs模板生成代码
4. **一致性检查**: 定期运行check-consistency.js验证一致性

## AI编程指令

// AI-INSTRUCTION:
// When working with this project:
// 1. Always refer to validation-metadata.json for validation rules
// 2. Use shared validation library for consistent validation
// 3. Follow the comment guidelines in ai-comment-guidelines.md
// 4. Use code templates for consistent code generation
// 5. Maintain consistency between frontend and backend validation
// 6. Update validation-metadata.json when adding new validation rules
// 7. Run check-consistency.js after making validation-related changes