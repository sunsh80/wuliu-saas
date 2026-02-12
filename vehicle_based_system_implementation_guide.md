# 车辆维度的订单管理与风控系统实施指南

## 1. 系统概述

本系统将订单管理从承运商维度细化到车辆维度，实现更精细化的运营管理。每辆车独立管理其活跃订单数、处罚状态和抽成规则。

## 2. 核心功能

### 2.1 车辆订单限制
- 每辆车默认最多同时处理3个订单（可配置）
- 订单状态为 'pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit' 时计入活跃订单数

### 2.2 违规处罚机制
- **轻微违规**（客户选择前取消）：车辆禁用30分钟，平台抽成增加2%
- **严重违规**（客户选择后取消）：车辆禁用24小时，平台抽成增加5%
- **累计处罚**：处罚积分影响车辆评级和接单优先级

### 2.3 车辆选择机制
- 承运商认领订单时需指定具体车辆
- 系统自动过滤出满足订单要求的可用车辆
- 考虑载重、体积、车型等多重因素

## 3. 数据库变更

### 3.1 tenant_vehicles 表扩展
```sql
ALTER TABLE tenant_vehicles ADD COLUMN current_active_orders INTEGER DEFAULT 0;
ALTER TABLE tenant_vehicles ADD COLUMN max_active_orders INTEGER DEFAULT 3;
ALTER TABLE tenant_vehicles ADD COLUMN penalty_points INTEGER DEFAULT 0;
ALTER TABLE tenant_vehicles ADD COLUMN penalty_expiry_time TEXT;
ALTER TABLE tenant_vehicles ADD COLUMN commission_increase_percent REAL DEFAULT 0;
ALTER TABLE tenant_vehicles ADD COLUMN commission_increase_expiry TEXT;
ALTER TABLE tenant_vehicles ADD COLUMN suspension_reason TEXT;
```

### 3.2 violation_records 表扩展
```sql
ALTER TABLE violation_records ADD COLUMN vehicle_id INTEGER;
```

## 4. API接口

### 4.1 承运商端接口
- `GET /api/carrier/vehicles/available` - 获取可用车辆
- `PUT /api/carrier/orders/{order_id}/claim-with-vehicle` - 使用指定车辆认领订单
- `DELETE /api/carrier/orders/{order_id}/release-by-vehicle` - 使用指定车辆释放订单

### 4.2 管理员端接口
- `PUT /api/admin/risk-control/violations/{id}/process` - 处理车辆违规记录

## 5. 业务流程

### 5.1 认领订单流程
1. 承运商选择订单
2. 系统查询可用车辆列表
3. 承运商选择合适车辆
4. 系统验证车辆状态和容量
5. 更新订单的vehicle_id和carrier_id
6. 增加车辆活跃订单计数

### 5.2 释放订单流程
1. 承运商请求释放订单
2. 系统根据订单状态判断违规类型
3. 创建违规记录
4. 更新车辆处罚状态
5. 减少车辆活跃订单计数
6. 应用相应的处罚措施

### 5.3 违规处理流程
1. 管理员审核违规记录
2. 批准/拒绝处罚或申诉
3. 更新车辆处罚积分
4. 执行相应处罚措施

## 6. 处罚规则

### 6.1 违规类型与处罚
| 违规类型 | 处罚积分 | 禁用时长 | 抽成增加 |
|---------|---------|----------|----------|
| 客户选择前取消 | 5 | 30分钟 | 2% |
| 客户选择后取消 | 20 | 24小时 | 5% |

### 6.2 累计处罚
| 处罚积分 | 处罚措施 |
|---------|----------|
| 0-29 | 正常运营 |
| 30-49 | 黄色警告，限制功能 |
| 50-99 | 橙色警告，限制接单 |
| ≥100 | 红色警告，暂停车辆 |

## 7. 实施步骤

### 7.1 数据库迁移
1. 执行数据库表结构变更
2. 初始化现有车辆数据

### 7.2 API部署
1. 部署新的API处理器
2. 更新API文档

### 7.3 前端更新
1. 承运商端增加车辆选择功能
2. 更新订单认领界面

### 7.4 配置管理
1. 设置默认参数
2. 配置处罚规则

## 8. 测试要点

### 8.1 功能测试
- 车辆订单限制功能
- 违规处罚机制
- 车辆选择算法

### 8.2 性能测试
- 高并发订单认领
- 大量车辆查询性能

### 8.3 安全测试
- 权限验证
- 数据一致性

## 9. 运维监控

### 9.1 关键指标
- 车辆利用率
- 违规事件统计
- 处罚执行情况

### 9.2 告警机制
- 高频违规告警
- 系统异常告警

## 10. 后续优化

### 10.1 智能调度
- 基于地理位置的车辆推荐
- 智能路径规划

### 10.2 信用体系
- 车辆信用评级
- 差异化服务策略

此系统实现了以车辆为单位的精细化管理，提高了运营效率和风险控制能力。