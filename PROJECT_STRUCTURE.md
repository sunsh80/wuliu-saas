# 物流系统项目结构说明

## 项目概览

这是一个完整的物流管理系统，包含后端API、PC端管理界面、移动端小程序和多租户支持。项目已升级为AI友好的开发模式，具有统一的验证系统和标准化的开发流程。

## 当前项目结构

```
物流系统项目/
├── backend/                    # 后端服务
│   ├── api/                   # API处理器
│   │   ├── handlers/          # 各类API处理程序
│   │   │   ├── admin/         # 管理员API
│   │   │   ├── carrier/       # 承运商API
│   │   │   ├── customer/      # 客户API
│   │   │   ├── public/        # 公共API
│   │   │   ├── setup/         # 系统设置API
│   │   │   └── tenant/        # 租户API
│   │   └── middleware/        # 中间件
│   ├── config/                # 配置文件
│   ├── db/                    # 数据库模块
│   │   ├── models/            # 数据模型
│   │   └── schema.js          # 数据库模式定义
│   ├── middleware/            # 认证中间件
│   │   ├── validation.js      # 验证中间件
│   │   └── api-validator.js   # API验证器
│   ├── openapi.yaml           # API规范
│   └── server.js              # 服务器入口
├── wx-program/               # 小程序前端
│   ├── pages/                # 页面
│   │   ├── company-register/ # 公司注册页面
│   │   ├── login/            # 登录页面
│   │   ├── index/            # 首页
│   │   ├── my/               # 个人中心
│   │   ├── order/            # 订单相关页面
│   │   ├── orderList/        # 订单列表
│   │   ├── orderStatus/      # 订单状态
│   │   ├── orderTrack/       # 订单追踪
│   │   ├── orderComparison/  # 订单对比
│   │   └── logs/             # 日志页面
│   ├── utils/                # 工用函数
│   │   └── validation-rules.js # 验证规则库
│   ├── app.js                # 小程序入口
│   ├── app.json              # 小程序配置
│   └── app.wxss              # 小程序样式
├── tenant-web/               # 租户管理前端
├── web/                      # 前端项目
├── docs/                     # 文档
├── scripts/                  # 脚本工具
├── logs/                     # 日志文件
├── node_modules/             # 依赖包
├── .ai-config.json           # AI编程配置
├── .gitignore                # Git忽略配置
├── README.md                 # 项目说明
├── PROJECT_STRUCTURE.md      # 项目结构说明
├── PROJECT_SUMMARY.md        # 项目总结
├── ai-comment-guidelines.md  # AI注释规范
├── ai-development-workflow.md # AI开发工作流程
├── check-consistency.js      # 一致性检查脚本
├── code-generation-template.hbs # 代码生成模板
├── db-field-mapping.json     # 数据库字段映射
├── package.json              # 项目配置
├── project-structure.md      # 项目结构文档
├── validation-metadata.json  # 验证元数据
├── validation-rules.js       # 共享验证规则库
├── validation-spec.md        # 验证规范文档
└── AUTO_PUSH_README.md       # 自动推送说明
```

## 核心功能模块

### 1. 后端API模块
- **认证模块**: 用户登录、会话管理、权限控制
- **订单模块**: 订单创建、查询、状态管理
- **租户模块**: 租户注册、资料管理、角色管理
- **承运商模块**: 承运商管理、报价系统、订单分配
- **公共模块**: 匿名下单、订单查询（已移除匿名下单功能）

### 2. 前端界面模块
- **PC管理端**: 管理员后台、订单管理、财务核对
- **小程序端**: 
  - 用户注册（公司注册流程）
  - 用户登录（支持邮箱/手机号登录）
  - 订单管理（创建订单、查看订单、订单追踪）
  - 个人中心（用户资料管理）
- **租户端**: 租户管理、订单处理、财务结算

### 3. 数据库模块
- SQLite数据库
- 多租户数据隔离
- 完整的订单生命周期管理

### 4. AI编程支持模块
- **验证系统**: 统一的验证规则库，前后端一致性
- **元数据**: 验证规则元数据，便于AI理解
- **中间件**: 验证中间件，API层验证
- **文档**: AI友好的注释规范和开发流程
- **模板**: 代码生成模板，标准化开发

## API端点说明

### 租户API (需认证)
- `POST /api/tenant-web/register` - 租户/客户注册
- `POST /api/tenant-web/login` - 租户/客户登录
- `GET /api/tenant-web/profile` - 获取用户资料
- `GET /api/tenant-web/orders/pending` - 获取待处理订单
- `POST /api/tenant-web/orders/{orderId}/claim` - 认领订单
- `POST /api/tenant-web/orders/{orderId}/complete` - 完成订单

### 客户API (需认证)
- `POST /api/customer/orders` - 创建客户订单
- `GET /api/customer/orders` - 获取客户订单列表
- `GET /api/customer/orders/{orderId}` - 获取订单详情
- `PUT /api/customer/orders/{orderId}` - 更新订单
- `DELETE /api/customer/orders/{orderId}` - 删除订单
- `GET /api/customer/orders/{orderId}/quotes` - 获取订单报价

### 管理员API (需认证)
- `GET /api/admin/orders` - 获取所有订单
- `GET /api/admin/tenants` - 获取租户列表
- `PUT /api/admin/orders/{id}/status` - 更新订单状态

### 承运商API (需认证)
- `GET /api/carrier/orders` - 获取可认领订单
- `POST /api/carrier/orders/{orderId}/claim` - 认领订单
- `POST /api/carrier/orders/{orderId}/complete` - 完成订单
- `POST /api/carrier/orders/{orderId}/quote` - 提交报价

## 验证系统

### 共享验证规则
- **手机号**: `^1[3-9][0-9]{9}$` - 中国手机号格式
- **邮箱**: `^[^\s@]+@[^\s@]+\.[^\s@]+$` - 邮箱格式
- **用户名**: `^[a-zA-Z0-9_-]{3,20}$` - 用户名格式
- **姓名**: `^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,50}$` - 支持中文姓名
- **地址**: `^[\u4e00-\u9fa5a-zA-Z0-9\s\S]{1,200}$` - 地址格式
- **密码**: 最小长度6位

### 验证层次
1. **前端验证**: 小程序使用验证库进行即时验证
2. **API验证**: API层使用验证中间件进行请求验证
3. **业务验证**: 业务逻辑层进行业务规则验证

## 项目特点

1. **多租户架构**: 支持客户、承运商、管理员多种角色
2. **双端支持**: PC端管理界面 + 移动端小程序
3. **安全认证**: 基于Session的认证机制
4. **统一验证**: 前后端验证规则完全一致
5. **AI友好**: 标准化的开发流程和文档
6. **实时状态**: 订单状态实时跟踪
7. **财务集成**: 预留财务核对功能

## AI编程模式

### 验证系统
- **共享验证库**: `validation-rules.js` 提供前后端一致的验证规则
- **验证元数据**: `validation-metadata.json` 定义所有验证规则的元数据
- **一致性检查**: `check-consistency.js` 确保验证规则的一致性
- **验证中间件**: `backend/middleware/validation.js` 提供API层验证

### AI配置
- **AI配置文件**: `.ai-config.json` 为AI提供项目配置信息
- **注释规范**: `ai-comment-guidelines.md` 定义AI友好的注释规范
- **代码模板**: `code-generation-template.hbs` 提供标准化的代码生成模板

### 开发工作流程
- **工作流程文档**: `ai-development-workflow.md` 详细说明AI辅助开发流程
- **项目结构**: `project-structure.md` 帮助AI理解项目架构

## 开发标准

- 遵循RESTful API设计规范
- 使用OpenAPI 3.0定义API接口
- 前后端分离架构
- 移动端优先设计
- 安全的认证和授权机制
- 统一的验证规则系统
- AI友好的注释和文档

## 运行项目

### 后端服务
```bash
cd backend
npm install
npm start
```

### 前端页面
- PC端: 直接打开HTML文件
- 小程序: 使用微信开发者工具导入项目

## 文件组织

- **核心代码**: 位于各功能模块目录中
- **文档**: 统一存放于根目录
- **验证系统**: 集中管理验证规则和中间件
- **AI支持**: AI配置、文档和模板文件

项目结构清晰，验证系统统一，AI编程模式完善，便于维护和扩展。