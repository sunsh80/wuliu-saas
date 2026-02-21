# 数孪智运无人物流 SaaS 平台

## 项目概述

这是一个综合性的智慧物流管理系统，支持多租户架构，包含后端 API 服务、PC 端管理后台、租户 Web 端和移动端小程序。平台提供订单管理、车辆调度、路径规划、财务结算、风控管理等完整功能。

## 项目结构

```
wuliu_project/
├── backend/                    # 后端服务
│   ├── server.js              # 服务器入口（OpenAPI 统一处理器）
│   ├── openapi.yaml           # OpenAPI 3.0 规范定义
│   ├── api/
│   │   └── handlers/          # OpenAPI 处理器
│   │       ├── admin/         # 管理员端处理器
│   │       ├── carrier/       # 承运商端处理器
│   │       ├── customer/      # 客户端处理器
│   │       ├── tenant-web/    # 租户 Web 端处理器
│   │       ├── map/           # 地图服务处理器
│   │       └── settlement/    # 结算处理器
│   ├── middleware/            # 中间件（认证、限流、错误处理）
│   ├── db/
│   │   ├── models/            # ORM 模型层
│   │   ├── migrations/        # 数据库迁移脚本
│   │   ├── schema.js          # 数据库表结构
│   │   └── index.js           # 数据库连接管理
│   ├── services/
│   │   ├── business/          # 业务服务层
│   │   ├── providers/         # 服务提供商实现
│   │   └── third-party/       # 第三方服务抽象
│   ├── routes/                # 传统路由（兼容层）
│   ├── config/                # 配置文件
│   ├── utils/                 # 工具函数
│   └── scripts/               # 数据库脚本
├── web/
│   ├── admin-web/             # PC 端管理后台
│   ├── tenant-web/            # 租户 Web 端
│   └── customer-web/          # 客户端 Web
├── wx-program/                # 微信小程序
├── scripts/                   # 运维脚本
└── docs/                      # 项目文档
```

## 核心功能模块

### 后端 API

#### 1. 认证与授权
- ✅ Session 认证（登录/登出）
- ✅ JWT Token 认证
- ✅ 多角色权限控制（超级管理员、承运商、客户）
- ✅ OpenAPI 安全处理器统一认证

#### 2. 订单管理
- ✅ 匿名/登录用户下单
- ✅ 订单状态流转（创建→待接单→已接单→运输中→已完成）
- ✅ 多承运商报价/竞价
- ✅ 订单分配与调度
- ✅ 订单查询与追踪

#### 3. 承运商管理
- ✅ 承运商入驻审核
- ✅ 承运商车辆管理
- ✅ 承运商报价配置
- ✅ 承运商订单管理
- ✅ 停靠点管理（创建/编辑/删除/审核）

#### 4. 车辆管理
- ✅ 车型库管理（8 种默认车型）
- ✅ 租户车辆绑定
- ✅ 车辆状态追踪
- ✅ 车辆违规管理
- ✅ 车辆位置实时监控

#### 5. 地图与路径规划
- ✅ 地理编码/逆地理编码
- ✅ 路径规划（驾车路线）
- ✅ 距离计算
- ✅ 周边 POI 搜索
- ✅ 无人车路径规划（AutoX 集成）
- ✅ 车辆轨迹追踪
- ✅ 实时位置更新

#### 6. 财务与结算
- ✅ 钱包管理（充值/余额查询）
- ✅ 钱包交易记录
- ✅ 订单结算
- ✅ 佣金管理（配置/计算/历史记录）
- ✅ 平台定价规则
- ✅ 承运商定价配置

#### 7. 风控管理
- ✅ 违规行为记录
- ✅ 违规统计与分析
- ✅ 车辆违规处理

#### 8. 系统管理
- ✅ 用户管理
- ✅ 租户管理
- ✅ 系统配置
- ✅ 数据字典

### 前端功能

#### PC 端管理后台
- ✅ 现代化 Dashboard 界面
- ✅ 订单管理（审核/调度/追踪）
- ✅ 承运商管理（审核/评级）
- ✅ 财务管理（对账/结算）
- ✅ 数据统计与报表
- ✅ 系统配置管理

#### 租户 Web 端
- ✅ 订单管理（发布/查询/分配）
- ✅ 车辆管理
- ✅ 报价管理
- ✅ 财务查询

#### 移动端小程序
- ✅ 匿名扫码下单
- ✅ 登录下单
- ✅ 订单状态查询
- ✅ 地图选点（停靠点）
- ✅ 个人中心

## 技术栈

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 14+ | 运行环境 |
| Express | 4.x | Web 框架 |
| SQLite3 | 5.x | 数据库 |
| OpenAPI | 3.0 | API 规范 |
| bcryptjs | 2.x | 密码加密 |
| jsonwebtoken | 9.x | JWT 认证 |
| helmet | 4.x | 安全中间件 |
| express-rate-limit | 6.x | 限流保护 |
| cors | 2.x | 跨域支持 |
| cookie-parser | 1.x | Cookie 解析 |

### 前端
| 技术 | 用途 |
|------|------|
| HTML5/CSS3/JavaScript | 基础技术栈 |
| Vue.js | 前端框架 |
| Bootstrap | UI 框架 |
| 微信小程序 API | 小程序开发 |

### 第三方服务
| 服务 | 用途 |
|------|------|
| 腾讯地图/百度地图 | 地理编码、路径规划 |
| AutoX | 无人车路径规划 |
| 车辆公司跟踪 API | 车辆位置追踪 |

## API 规范

### 设计原则
- RESTful API 设计风格
- OpenAPI 3.0 规范定义
- 统一的请求/响应格式
- 统一的错误处理机制

### 认证方式
```yaml
# Session 认证（主要）
Cookie: connect.sid=<session_id>

# JWT Token 认证（备用）
Authorization: Bearer <token>
```

### 响应格式
```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "操作成功"
}
```

### 错误码规范
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 数据库设计

### 核心表结构

| 表名 | 说明 |
|------|------|
| users | 用户表（管理员、承运商、客户） |
| tenants | 租户表（承运商/客户公司） |
| customers | 客户表 |
| orders | 订单表 |
| quotes | 报价表 |
| tenant_vehicles | 租户车辆表 |
| vehicle_models | 车型库表 |
| vehicle_tracking | 车辆追踪表 |
| vehicle_positions | 车辆位置记录表 |
| wallets | 钱包表 |
| wallet_transactions | 钱包交易表 |
| settlements | 结算表 |
| commission_configs | 佣金配置表 |
| commission_history | 佣金历史记录 |
| platform_pricing_rules | 平台定价规则表 |
| carrier_pricing_configs | 承运商定价配置表 |
| stop_points | 停靠点表 |
| user_sessions | 用户会话表 |
| organizations | 组织表 |
| violations | 违规记录表 |
| tenant_applications | 租户申请表 |
| customer_applications | 客户申请表 |

### 数据库初始化
```bash
# 数据库会自动初始化，包含：
# - 默认管理员账户（admin/admin123）
# - 8 种默认车型数据
# - 基础表结构
```

## 运行项目

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 后端服务
```bash
cd backend
npm install
npm start

# 开发模式
npm run dev
```

### 前端服务
```bash
# PC 端管理后台
cd web/admin-web
# 使用 live-server 或类似工具启动

# 租户 Web 端
cd web/tenant-web

# 客户端 Web
cd web/customer-web
```

### 小程序
```bash
# 使用微信开发者工具打开 wx-program 目录
```

### 一键启动脚本
```bash
# Windows
scripts/full_stack_start.bat

# 快速启动
scripts/quick_start.bat
```

## 配置说明

### 环境变量（.env）
```bash
# 服务器配置
PORT=3000
NODE_ENV=development
SERVER_NAME=物流平台 API

# Session 配置
SESSION_SECRET=your_secret_key

# JWT 配置
JWT_SECRET=your_jwt_secret

# 数据库配置
DATABASE_PATH=./data/mydatabase.db

# 地图服务配置
MAP_PROVIDER=TencentMap
TENCENT_MAP_API_KEY=your_api_key
TENCENT_MAP_ENABLED=true

# 路径规划配置
AV_ROUTE_PROVIDER=AutoXAVRoute
AUTOX_AV_ROUTE_API_KEY=your_api_key

# 车辆跟踪配置
TRACKING_PROVIDER=VehicleCompanyTracking
VEHICLE_COMPANY_API_ENDPOINT=https://api.vehicle-company.com
VEHICLE_COMPANY_AUTH_TOKEN=your_token
```

## 脚本管理

### 运维脚本（scripts/）
| 脚本 | 功能 |
|------|------|
| full_stack_start.bat | 完整全栈启动 |
| quick_start.bat | 快速启动后端 |
| check_status.bat | 检查服务状态 |
| auto_push.bat | 自动推送代码 |
| auto_push.ps1 | PowerShell 自动推送 |

### 数据库脚本（backend/scripts/）
| 脚本 | 功能 |
|------|------|
| init_database.js | 初始化数据库 |
| check_db.js | 检查数据库状态 |
| add_shenyang_stop_points.js | 添加沈阳停靠点数据 |

## 开发标准

### API 参数命名规范
- 前端 JavaScript：camelCase（如 `orderId`, `carrierId`）
- API 路径参数：snake_case（如 `order_id`, `carrier_id`）
- 数据库字段：snake_case（如 `order_id`, `carrier_id`）
- 请求体参数：camelCase（如 `orderId`, `carrierId`）

### 代码规范
- 遵循 ESLint 标准
- 使用 JSDoc 注释
- 模块化开发
- 错误处理完善

## 项目文档

### 核心文档
| 文档 | 说明 |
|------|------|
| `docs/` | 项目文档目录 |
| `backend/openapi.yaml` | API 规范文档 |
| `ai-comment-guidelines.md` | AI 注释规范 |

### 功能模块文档
| 文档 | 说明 |
|------|------|
| `OPENAPI 处理器统一迁移完成报告.md` | OpenAPI 迁移说明 |
| `map-Management-完成记录.md` | 地图管理功能说明 |
| `FINANCIAL_SYSTEM_INTEGRATION_REPORT.md` | 财务系统集成报告 |
| `risk_control_module_design.md` | 风控模块设计 |
| `wallet_module_design.md` | 钱包模块设计 |
| `commission_management_design.md` | 佣金管理设计 |

### 开发计划
| 文档 | 说明 |
|------|------|
| `DEVELOPMENT_PLAN.md` | 开发计划 |
| `ORDER_FEATURE_EXTENSION_PLAN.md` | 订单功能扩展计划 |
| `THIRD_PARTY_INTEGRATION_PLAN.md` | 第三方集成计划 |

## 测试

### API 测试
```bash
# 运行自动化测试
node backend/test/api.js

# 运行完整流程测试
node backend/full_order_flow_test.js
```

### 测试报告
测试报告位于 `test_report.json`，包含：
- API 功能测试通过率
- 系统稳定性评估
- 认证功能验证结果

## 后续开发计划

### 短期目标
- [ ] 完善支付功能集成
- [ ] 优化移动端性能
- [ ] 实现推送通知功能
- [ ] 完善数据统计报表

### 中期目标
- [ ] 集成更多地图服务商
- [ ] 支持多无人车协同调度
- [ ] 实现智能路径优化
- [ ] 完善风控预警系统

### 长期目标
- [ ] AI 智能调度算法
- [ ] 大数据分析平台
- [ ] 区块链溯源
- [ ] IoT 设备集成

## 常见问题

### 数据库问题
```bash
# 检查数据库状态
node backend/check_db.js

# 重新初始化数据库
node backend/init_database.js
```

### 服务启动问题
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 清理并重启
npm run clean && npm start
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

- 项目仓库：https://github.com/sunsh80/wuliu-saas
- 问题反馈：提交 Issue

---

**最后更新**: 2026-02-21
