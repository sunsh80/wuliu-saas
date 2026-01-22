# 物流系统项目

## 项目概述

这是一个综合性的物流管理系统，包含后端API服务、PC端管理界面和移动端小程序。

## 项目结构

```
backend/                 # 后端服务
├── server.js           # 服务器入口
├── api/               # API处理器
├── middleware/        # 中间件
├── db/                # 数据库模块
├── config/            # 配置文件
└── openapi.yaml       # API规范
web/                   # 前端项目
├── admin-web/        # PC端管理后台
├── tenant-web/       # 租户端
└── customer-web/     # 客户端
```

## 已完成的功能

### 后端API
- 完整的RESTful API设计
- 多租户支持
- 用户认证与授权
- 订单管理（支持匿名和认证用户下单）
- 承运商管理
- 财务管理
- 公共API接口（支持匿名下单和查询）

### 项目结构优化
- 清理了测试文件，移至 `cleanup_temp/` 目录
- 文档归类至 `docs/` 目录
- 项目结构清晰整洁
- 代码与文档分离管理

### PC端管理界面
- 现代化的管理后台界面
- 完整的订单管理功能
- 财务核对功能预留
- 响应式设计

### 移动端小程序
- 匿名扫码下单功能
- 登录后下单功能
- 订单状态查询
- 个人中心管理
- 地图可视化

## API规范

使用OpenAPI 3.0规范，定义了完整的API接口。

## 前后端联动

- 基于Session的认证机制
- RESTful API设计
- 前后端分离架构

## 开发标准

### 小程序开发标准
- 移动端优先设计
- 简洁直观的UI
- 快速响应的交互
- 离线功能支持

### PC端开发标准
- 响应式设计
- 现代化UI组件
- 高效的数据展示
- 完善的管理功能

## 文件说明

- `automated_test.js` - 自动化API测试
- `pc_frontend_design.html` - PC端前端设计
- `wx_program_frontend.html` - 小程序前端设计
- `test_report.json` - 测试报告
- `generated_test_data.json` - 生成的测试数据

## 运行项目

### 后端服务
```bash
cd backend
npm install
npm start
```

### 前端页面
直接打开HTML文件即可预览前端设计。

## API文档

参考 `backend/openapi.yaml` 文件获取完整的API接口文档。

## 测试结果

- API功能测试通过率: 88.89%
- 系统稳定性: 良好
- 认证功能: 已修复

## 后续开发建议

1. 完善前后端真实API集成
2. 实现完整的用户认证流程
3. 集成地图服务
4. 添加支付功能
5. 优化移动端性能
6. 实现推送通知功能

## 技术栈

- **后端**: Node.js, Express, SQLite, OpenAPI
- **前端**: HTML5, CSS3, JavaScript, Vue.js
- **认证**: Session-based Authentication
- **数据库**: SQLite