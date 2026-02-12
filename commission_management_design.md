# 平台抽佣管理模块设计方案

## 概述
本模块实现平台抽佣规则的灵活配置，支持总后台对抽佣比例的动态调整，精确到承运商名下的每辆车。

## 数据库表结构

### 1. commission_rules 表 - 抽佣规则表
```sql
CREATE TABLE commission_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL, -- 规则名称
  base_commission_percent REAL NOT NULL DEFAULT 10.0, -- 基础抽成百分比
  min_commission_percent REAL DEFAULT 0.0, -- 最小抽成百分比
  max_commission_percent REAL DEFAULT 50.0, -- 最大抽成百分比
  description TEXT, -- 规则描述
  is_active BOOLEAN DEFAULT 1, -- 是否激活
  created_by INTEGER, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 2. vehicle_commission_overrides 表 - 车辆抽佣覆盖表
```sql
CREATE TABLE vehicle_commission_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL, -- 车辆ID
  override_type TEXT NOT NULL CHECK (override_type IN ('fixed', 'percentage', 'multiplier')), -- 覆盖类型
  override_value REAL NOT NULL, -- 覆盖值
  reason TEXT, -- 调整原因
  effective_from TEXT NOT NULL DEFAULT (datetime('now')), -- 生效时间
  effective_until TEXT, -- 失效时间（可选）
  created_by INTEGER, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 3. commission_history 表 - 抽佣历史记录表
```sql
CREATE TABLE commission_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  vehicle_id INTEGER, -- 车辆ID
  base_commission_percent REAL NOT NULL, -- 基础抽成比例
  override_commission_percent REAL, -- 覆盖抽成比例
  final_commission_percent REAL NOT NULL, -- 最终抽成比例
  calculated_amount REAL NOT NULL, -- 计算得出的抽成金额
  applied_rule_id INTEGER, -- 应用的规则ID
  adjustment_reason TEXT, -- 调整原因
  processed_by INTEGER, -- 处理人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (applied_rule_id) REFERENCES commission_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

## API接口设计

### 1. 管理员端 - 抽佣规则管理
```
GET /api/admin/commission/rules - 获取抽佣规则列表
POST /api/admin/commission/rules - 创建抽佣规则
PUT /api/admin/commission/rules/{id} - 更新抽佣规则
DELETE /api/admin/commission/rules/{id} - 删除抽佣规则
```

### 2. 管理员端 - 车辆抽佣配置
```
GET /api/admin/commission/vehicles - 获取车辆抽佣配置列表
POST /api/admin/commission/vehicles - 为车辆设置抽佣覆盖
PUT /api/admin/commission/vehicles/{id} - 更新车辆抽佣覆盖
DELETE /api/admin/commission/vehicles/{id} - 删除车辆抽佣覆盖
```

### 3. 管理员端 - 抽佣历史
```
GET /api/admin/commission/history - 获取抽佣历史记录
GET /api/admin/commission/history/{order_id} - 获取特定订单的抽佣详情
```

### 4. 承运商端 - 查看抽佣信息
```
GET /api/carrier/commission/info - 获取当前车辆的抽佣信息
GET /api/carrier/commission/history - 获取车辆抽佣历史
```

## 抽佣计算逻辑

### 1. 抽佣计算优先级
1. 车辆特定覆盖规则（最高优先级）
2. 违规处罚导致的抽成增加
3. 基础抽佣规则（最低优先级）

### 2. 计算公式
```
最终抽成比例 = MIN(基础抽成比例 + 违规增加比例 + 其他调整, 最大抽成比例)
最终抽成比例 = MAX(最终抽成比例, 最小抽成比例)
```

### 3. 违规处罚与抽佣联动
- 当车辆发生违规时，系统自动创建临时抽佣覆盖记录
- 违规处罚期结束后，自动失效相应的抽佣增加

## 管理后台功能

### 1. 抽佣规则管理
- 创建、编辑、删除抽佣规则
- 设置基础抽成比例
- 配置最小/最大抽成限制

### 2. 车辆抽佣配置
- 为特定车辆设置抽佣覆盖
- 支持固定金额、百分比、乘数等多种覆盖类型
- 设置生效和失效时间

### 3. 实时监控
- 查看各车辆当前抽佣比例
- 监控抽佣调整历史
- 生成抽佣统计报表

### 4. 违规处罚联动
- 违规处理时自动应用抽佣调整
- 查看因违规导致的抽佣增加

## 业务流程

### 1. 订单结算时的抽佣计算流程
1. 获取订单关联的车辆信息
2. 查询车辆的基础抽佣规则
3. 检查是否有车辆特定的抽佣覆盖
4. 检查是否有因违规导致的抽佣增加
5. 计算最终抽佣比例
6. 记录抽佣历史

### 2. 违规处罚时的抽佣调整流程
1. 确认违规类型和处罚措施
2. 计算需要增加的抽成比例
3. 创建临时抽佣覆盖记录
4. 设置失效时间
5. 更新车辆抽佣状态

## 配置参数

### 1. 系统级配置
- 默认基础抽成比例：10%
- 最小抽成比例：0%
- 最大抽成比例：50%

### 2. 违规相关配置
- 轻微违规抽成增加：2%
- 严重违规抽成增加：5%
- 违规抽成增加有效期：7天

### 3. 车辆特定配置
- 每辆车可设置独立的抽佣比例
- 支持临时调整和永久调整

## 安全与审计

### 1. 权限控制
- 仅管理员可修改抽佣规则
- 所有抽佣调整操作需记录操作人

### 2. 审计日志
- 记录所有抽佣规则变更
- 记录所有车辆抽佣调整
- 记录订单结算时的抽佣计算过程

## 性能优化

### 1. 缓存策略
- 缓存常用的抽佣规则
- 缓存车辆抽佣配置

### 2. 索引优化
- 为车辆ID、订单ID等常用查询字段建立索引
- 为时间范围查询建立复合索引

## 部署建议

1. 更新数据库结构
2. 部署API处理器
3. 更新管理后台界面
4. 配置默认抽佣规则
5. 进行充分测试