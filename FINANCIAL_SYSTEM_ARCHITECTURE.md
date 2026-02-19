# 财务管理体系架构

## 一、系统概述

本财务管理体系贯穿：
1. **小程序支付端** - 客户下单支付
2. **承运商分佣端** - 承运商收入分配
3. **总后台规则端** - 抽佣规则配置
4. **总后台看板端** - 财务数据可视化

## 二、核心业务流程

### 2.1 完整订单资金流

```
客户 (小程序)
  │
  ├─ ① 下单支付 ¥200
  │   ↓
  │   客户钱包 -¥200
  │
  ├─ ② 平台抽佣 10% (¥20)
  │   ↓
  │   平台钱包 +¥20
  │
  └─ ③ 承运商净收入 ¥180
      ↓
      承运商钱包 +¥180
```

### 2.2 支付节点

| 节点 | 触发条件 | 操作 | 金额 |
|------|----------|------|------|
| 下单支付 | 客户确认订单 | 冻结客户钱包资金 | 订单全额 |
| 抽佣划转 | 订单完成 | 从客户钱包划转至平台 | 抽佣金额 |
| 承运商结算 | 订单完成 | 从客户钱包划转至承运商 | 净额 |

## 三、数据库表结构

### 3.1 核心表

- `wallets` - 钱包表（平台/承运商/客户）
- `wallet_transactions` - 钱包交易记录
- `settlements` - 结算记录
- `commission_configs` - 抽佣配置
- `commission_history` - 抽佣历史

### 3.2 表关系

```
orders (订单)
  │
  ├─→ settlements (结算记录)
  │     ├─→ wallet_transactions (交易记录)
  │     └─→ wallets (钱包)
  │
  └─→ commission_history (抽佣历史)
        └─→ commission_configs (抽佣配置)
```

## 四、API 接口

### 4.1 小程序端（客户）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/customer/orders` | POST | 创建订单（触发支付） |
| `/api/customer/wallet` | GET | 获取钱包余额 |
| `/api/customer/wallet/transactions` | GET | 获取交易记录 |

### 4.2 承运商端

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/carrier/orders` | GET | 可接订单列表 |
| `/api/carrier/quotes` | POST | 提交报价 |
| `/api/carrier/wallet` | GET | 获取钱包余额 |
| `/api/carrier/wallet/transactions` | GET | 收入明细 |
| `/api/carrier/commission/info` | GET | 获取车辆抽佣信息 |

### 4.3 管理后台

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/finance/overview` | GET | 财务概览看板 |
| `/api/admin/commissions/config` | GET/PUT | 抽佣规则配置 |
| `/api/admin/commissions/records` | GET | 抽佣记录 |
| `/api/admin/wallets` | GET | 钱包管理 |
| `/api/admin/settlements` | GET | 结算管理 |
| `/api/admin/settlements/process/{order_id}` | POST | 手动结算 |

## 五、前端页面

### 5.1 小程序端

- `pages/order/order.js` - 下单页面
- `pages/orderStatus/orderStatus.js` - 订单状态（含支付信息）
- `pages/my/my.js` - 我的钱包

### 5.2 承运商端

- `web/tenant-web/public/commissions.html` - 抽佣管理
- `web/tenant-web/public/wallet.html` - 钱包管理（待创建）

### 5.3 管理后台

- `web/admin-web/public/finance.html` - 财务管理主页（带二级导航）
- `web/admin-web/public/wallet-management.html` - 钱包管理
- `web/admin-web/public/commission-management.html` - 抽佣管理
- `web/admin-web/public/settlement-management.html` - 结算管理

## 六、抽佣规则设计

### 6.1 规则配置

```javascript
{
  rule_name: "默认规则",
  platform_rate: 0.05,           // 平台抽佣比例 5%
  carrier_rate: 0.03,            // 承运商抽佣比例 3%
  base_commission_percent: 10.0, // 基础抽佣比例 10%
  min_commission_percent: 0.0,   // 最低抽佣比例
  max_commission_percent: 50.0,  // 最高抽佣比例
  min_amount: 0.5,               // 最低抽佣金额
  max_amount: 50.0,              // 最高抽佣金额
  is_active: true
}
```

### 6.2 抽佣计算逻辑

```javascript
// 1. 获取基础规则
const baseRule = await db.get(
  'SELECT * FROM commission_configs WHERE is_active = 1 LIMIT 1'
);

// 2. 检查车辆特定覆盖
const vehicleOverride = await db.get(
  'SELECT * FROM vehicle_commission_overrides WHERE vehicle_id = ?',
  [vehicle_id]
);

// 3. 检查违规处罚
const penalty = await db.get(
  'SELECT commission_increase_percent FROM tenant_vehicles WHERE id = ?',
  [vehicle_id]
);

// 4. 计算最终抽佣比例
let finalCommission = baseRule.base_commission_percent;
if (vehicleOverride) {
  finalCommission = vehicleOverride.override_value;
}
if (penalty && penalty.commission_increase_percent) {
  finalCommission += penalty.commission_increase_percent;
}

// 5. 应用上下限
finalCommission = Math.max(finalCommission, baseRule.min_commission_percent);
finalCommission = Math.min(finalCommission, baseRule.max_commission_percent);

// 6. 计算抽佣金额
const commissionAmount = orderAmount * finalCommission / 100;
```

## 七、财务管理看板

### 7.1 核心指标

- **钱包总余额** - 平台、承运商、客户钱包余额汇总
- **今日抽佣** - 当日平台抽佣收入
- **待结算金额** - 已完成订单待结算金额
- **本月营收** - 当月平台总营收

### 7.2 数据可视化

- 抽佣趋势图（日/周/月）
- 钱包余额变化图
- 结算状态分布
- 承运商收入排行

## 八、安全与风控

### 8.1 资金安全

- 所有资金操作使用数据库事务
- 余额充足性检查
- 防止重复扣款
- 交易流水完整记录

### 8.2 权限控制

- 管理员权限验证
- 承运商只能查看自己的钱包
- 客户只能查看自己的订单和支付

### 8.3 风控措施

- 钱包余额预警
- 异常交易监控
- 违规车辆抽佣上调
- 结算审核机制

## 九、第三方集成

### 9.1 支付渠道

- 微信支付
- 支付宝
- 银行存管

### 9.2 分账系统

```
客户支付 → 第三方支付渠道 → 自动分账
                              ├─ 平台抽佣账户
                              └─ 承运商账户
```

## 十、文件清单

### 后端
- `backend/api/handlers/wallet/` - 钱包相关 Handler
- `backend/api/handlers/settlement/` - 结算相关 Handler
- `backend/api/handlers/admin/commissions/` - 抽佣管理 Handler
- `backend/db/models/Commission.js` - 抽佣模型
- `backend/db/migrations/003_add_wallet_tables.js` - 钱包表迁移
- `backend/db/migrations/002_add_management_tables.js` - 管理表迁移

### 前端
- `web/admin-web/public/finance.html` - 财务管理主页
- `web/admin-web/public/wallet-management.html` - 钱包管理
- `web/admin-web/public/commission-management.html` - 抽佣管理
- `web/admin-web/public/settlement-management.html` - 结算管理
- `wx-program/pages/order/` - 小程序下单页面

### 文档
- `docs/wallet-commission-management.md` - 钱包与抽佣管理文档
- `wallet_module_design.md` - 钱包模块设计
- `wallet_module_completion_report.md` - 钱包模块完成报告
- `FINANCIAL_SYSTEM_ARCHITECTURE.md` - 本文件

---

**状态**: 后端 API 已完成，前端管理页面开发中
**最后更新**: 2026-02-19
