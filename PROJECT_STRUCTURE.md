# 物流系统项目结构说明

## 项目概览

这是一个完整的物流管理系统，包含后端API、PC端管理界面、移动端小程序和多租户支持。

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
│   │   │   └── tenant/        # 租户API
│   │   └── middleware/        # 中间件
│   ├── config/                # 配置文件
│   ├── db/                    # 数据库模块
│   ├── middleware/            # 认证中间件
│   ├── openapi.yaml           # API规范
│   └── server.js              # 服务器入口
├── web/                       # 前端项目
│   ├── admin-web/            # 管理员端
│   ├── customer-web/         # 客户端
│   └── tenant-web/           # 租户端
├── wx-program/               # 小程序前端
├── tenant-web/               # 租户管理前端
├── docs/                     # 文档
├── scripts/                  # 脚本工具
├── logs/                     # 日志文件
├── node_modules/             # 依赖包
├── cleanup_temp/             # 清理的测试文件
├── .gitignore                # Git忽略配置
├── package.json              # 项目配置
├── README.md                 # 项目说明
└── PROJECT_SUMMARY.md        # 项目总结
```

## 核心功能模块

### 1. 后端API模块
- **认证模块**: 用户登录、会话管理、权限控制
- **订单模块**: 订单创建、查询、状态管理
- **租户模块**: 租户注册、资料管理、角色管理
- **承运商模块**: 承运商管理、报价系统、订单分配
- **公共模块**: 匿名下单、订单查询

### 2. 前端界面模块
- **PC管理端**: 管理员后台、订单管理、财务核对
- **小程序端**: 匿名下单、登录下单、订单查询
- **租户端**: 租户管理、订单处理、财务结算

### 3. 数据库模块
- SQLite数据库
- 多租户数据隔离
- 完整的订单生命周期管理

## API端点说明

### 公共API (无需认证)
- `POST /api/public/orders` - 匿名创建订单
- `GET /api/public/orders/:id` - 通过订单号或电话查询订单

### 客户API (需认证)
- `POST /api/customer/orders` - 创建客户订单
- `GET /api/customer/orders` - 获取客户订单列表
- `GET /api/customer/orders/:id` - 获取订单详情

### 管理员API (需认证)
- `GET /api/admin/orders` - 获取所有订单
- `GET /api/admin/tenants` - 获取租户列表
- `PUT /api/admin/orders/:id/status` - 更新订单状态

### 承运商API (需认证)
- `GET /api/carrier/orders` - 获取可认领订单
- `PUT /api/carrier/orders/:id/claim` - 认领订单
- `PUT /api/carrier/orders/:id/complete` - 完成订单

## 项目特点

1. **多租户架构**: 支持客户、承运商、管理员多种角色
2. **双端支持**: PC端管理界面 + 移动端小程序
3. **安全认证**: 基于Session的认证机制
4. **灵活下单**: 支持匿名和认证两种下单模式
5. **实时状态**: 订单状态实时跟踪
6. **财务集成**: 预留财务核对功能

## 开发标准

- 遵循RESTful API设计规范
- 使用OpenAPI 3.0定义API接口
- 前后端分离架构
- 移动端优先设计
- 安全的认证和授权机制

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
- **文档**: 统一存放于docs目录
- **测试文件**: 已移至cleanup_temp目录（可安全删除）
- **配置**: 集中管理在config目录

项目结构清晰，便于维护和扩展。