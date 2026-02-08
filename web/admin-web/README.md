# 物流管理系统 - 管理后台

## 项目概述
这是一个现代化的物流管理系统管理后台，采用前后端分离架构，提供订单管理、租户管理、入驻申请管理等功能。

## 功能特性
- 现代化的UI设计，包含侧边栏导航
- 响应式布局，支持多种设备
- 完整的用户认证系统
- 订单管理功能
- 租户管理功能
- 入驻申请管理功能
- 数据库连接与数据获取功能

## 技术栈
- 前端: HTML5, CSS3, JavaScript (ES6+)
- 构建工具: Vite
- UI框架: 自定义CSS样式
- 图标库: Font Awesome
- 数据库: MySQL (通过后端API访问)

## 页面结构
```
public/
├── index.html              # 管理系统首页
├── login.html              # 登录页面
├── orders.html             # 订单管理
├── tenants.html            # 租户管理
├── application-list.html   # 入驻申请管理
├── network-diagnostic.html # 网络连接诊断
├── connection-verification.html # 连接验证
├── css/
│   └── style.css           # 公共样式
├── js/
│   ├── main.js             # 主要JavaScript功能
│   ├── api.js              # API请求函数
│   ├── db-api.js           # 数据库API接口
│   └── api-tester.js       # API连接测试工具
└── favicon.ico
```

## 安装与运行

### 1. 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```
访问以下路径查看应用（不要直接双击HTML文件）:
- 登录页面: `http://localhost:5173/login.html`
- 管理首页: `http://localhost:5173/admin/index.html`
- 订单管理: `http://localhost:5173/admin/orders.html`
- 租户管理: `http://localhost:5173/admin/tenants.html`
- 入驻申请: `http://localhost:5173/admin/application-list.html`
- 连接验证: `http://localhost:5173/connection-verification.html`
- 网络诊断: `http://localhost:5173/network-diagnostic.html`

### 4. 构建生产版本
```bash
npm run build
```

## 数据库连接

### 1. 配置数据库连接
- 复制 `.env.example` 为 `.env`
- 根据实际情况修改数据库连接参数

### 2. 数据库连接测试
```bash
npm run db:test
```

### 3. 数据库功能
- 获取订单统计信息
- 获取租户统计信息
- 获取订单和租户列表
- 获取待审核租户
- 更新订单状态
- 批准/拒绝租户申请

## 登录功能
- 登录页面: `/login.html`
- 登录成功后跳转到: `/admin/index.html` (即 `public/index.html`)
- 使用JWT token进行身份验证
- token存储在localStorage中

## API集成
- 所有API请求通过 `/api` 代理到后端服务
- 后端服务默认运行在 `http://localhost:3000`
- 认证请求自动添加Authorization头
- 数据库操作通过后端API进行

## 设计特色
- 现代化的扁平设计风格
- 渐变色彩和阴影效果
- 响应式布局适配移动设备
- 统一的组件样式和交互反馈

## 部署说明
1. 构建项目: `npm run build`
2. 将 `dist` 目录部署到Web服务器
3. 配置反向代理将 `/api` 请求转发到后端服务
4. 确保后端服务配置了正确的数据库连接

## 开发指南
- 所有管理页面共享相同的侧边栏导航
- 使用统一的CSS样式类
- JavaScript函数模块化组织
- 遵循一致的代码风格
- 数据库操作通过API接口进行

## 维护说明
- 样式修改请在 `public/css/style.css` 中进行
- JavaScript逻辑在 `public/js/` 目录下
- 新增页面请保持与现有设计风格一致
- API调用请遵循现有模式
- 数据库相关功能在 `db-connector.js` 中实现

## 注意事项
- 确保后端服务正常运行以支持登录功能
- 登录凭据需与后端配置匹配
- JWT token有过期时间，过期后需重新登录
- 数据库连接配置需正确设置
- 生产环境中不要在前端直接暴露数据库连接信息