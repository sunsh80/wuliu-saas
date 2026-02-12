# 承运商车辆管理与风控系统设计方案

## 概述
本方案将订单限制从承运商级别调整为车辆级别，即每辆车最多同时处理3个订单，并建立相应的风控机制。

## 数据库表结构更新

### tenant_vehicles 表（已存在）
```sql
-- 确保表结构包含活跃订单计数字段
ALTER TABLE tenant_vehicles ADD COLUMN current_active_orders INTEGER DEFAULT 0;
ALTER TABLE tenant_vehicles ADD COLUMN max_active_orders INTEGER DEFAULT 3;
ALTER TABLE tenant_vehicles ADD COLUMN penalty_points INTEGER DEFAULT 0;
ALTER TABLE tenant_vehicles ADD COLUMN penalty_expiry_time TEXT; -- 处罚到期时间
```

### violation_records 表（已设计）
- 违规记录表保持不变，但增加vehicle_id字段
```sql
ALTER TABLE violation_records ADD COLUMN vehicle_id INTEGER;
```

## 业务逻辑调整

### 1. 认领订单逻辑（以车辆为单位）
- 承运商认领订单时，需要指定使用的车辆
- 检查该车辆当前活跃订单数是否超过限制
- 如果超过限制，禁止认领

### 2. 车辆活跃订单管理
- 每辆车最多同时处理3个订单（可配置）
- 订单状态为 'pending_claim', 'quoted', 'awarded', 'dispatched', 'in_transit' 时计入活跃订单数

### 3. 违规处罚机制
- **轻微违规**（客户选择前取消）：车辆禁用30分钟，平台抽成增加2%
- **严重违规**（客户选择后取消）：车辆禁用24小时，平台抽成增加5%
- **累计处罚**：处罚积分影响车辆评级和接单优先级

## API接口更新

### 1. 承运商获取可用车辆
```
GET /api/carrier/vehicles/available
参数: order_requirements（订单要求，如载重、体积等）
```

### 2. 承运商使用指定车辆认领订单
```
PUT /api/carrier/orders/{order_id}/claim-with-vehicle
请求体: vehicle_id
```

### 3. 承运商使用指定车辆释放订单
```
DELETE /api/carrier/orders/{order_id}/release-by-vehicle
请求体: vehicle_id
```

## 平台抽成机制

### 1. 基础抽成规则
- 默认抽成比例：10%

### 2. 违规惩罚抽成
- 轻微违规后：抽成增加2%（变为12%）
- 严重违规后：抽成增加5%（变为15%）
- 处罚期间：抽成比例持续生效

### 3. 车辆评级影响
- 高评级车辆：享受抽成优惠
- 低评级车辆：承担更高抽成

## 管理后台功能

### 1. 车辆管理
- 查看所有车辆状态
- 调整车辆最大活跃订单数
- 管理车辆处罚状态

### 2. 违规记录管理
- 查看车辆违规记录
- 处理违规申诉
- 调整处罚措施

## 实现逻辑

### 认领订单流程
1. 承运商选择订单
2. 选择可用车辆
3. 检查车辆当前活跃订单数
4. 如果未超限，更新订单的vehicle_id和carrier_id
5. 增加车辆活跃订单计数
6. 返回认领结果

### 释放订单流程
1. 承运商请求释放订单
2. 根据订单状态判断违规类型
3. 创建违规记录
4. 更新车辆处罚状态
5. 减少车辆活跃订单计数
6. 返回释放结果

## 配置参数

### 可配置项
- 每辆车默认最大活跃订单数：3
- 轻微违规处罚时长：30分钟
- 严重违规处罚时长：24小时
- 轻微违规抽成增加：2%
- 严重违规抽成增加：5%
- 处罚积分阈值：100分暂停车辆

## 代码实现要点

### 1. 车辆状态管理
- 使用数据库事务确保数据一致性
- 活跃订单计数的增减必须原子性操作

### 2. 处罚机制
- 处罚状态与时间戳结合
- 自动解除处罚状态

### 3. 抽成计算
- 在订单结算时应用相应的抽成比例
- 记录抽成变化历史

## 部署建议

1. 更新数据库结构
2. 部署新的API处理器
3. 更新前端界面（承运商端选择车辆）
4. 配置抽成规则
5. 进行充分测试