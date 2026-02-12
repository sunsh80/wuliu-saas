# 物流系统风控管理模块设计方案

## 概述
本模块旨在管理物流系统中的各种违约行为，包括承运商违约、客户违约等，通过建立完善的违规记录、处罚机制和申诉流程，维护平台的健康运营。

## 违规类型定义

### 承运商相关违约
1. **carrier_cancel_before_choice** - 承运商在客户选择前取消订单
   - 处罚积分：5分
   - 适用场景：承运商在客户选择承运商之前主动释放订单

2. **carrier_cancel_after_choice** - 承运商在客户选择后取消订单
   - 处罚积分：20分
   - 适用场景：客户已选择该承运商，但承运商取消订单（严重违约）

3. **late_delivery** - 延迟配送
   - 处罚积分：10分
   - 适用场景：未按时完成配送任务

4. **damaged_goods** - 货物损坏
   - 处罚积分：15分
   - 适用场景：配送过程中造成货物损坏

5. **service_complaint** - 服务投诉
   - 处罚积分：8分
   - 适用场景：客户投诉服务质量

### 客户相关违约
1. **customer_cancel** - 客户取消订单
   - 处罚积分：0分（通常不处罚客户）
   - 适用场景：客户在订单执行过程中取消

## 数据库表结构

### violation_records 表
```sql
CREATE TABLE violation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  violation_type TEXT NOT NULL, -- 违规类型
  target_type TEXT NOT NULL CHECK (target_type IN ('carrier', 'customer')), -- 违规对象类型
  target_id INTEGER NOT NULL, -- 承运商或客户ID
  description TEXT NOT NULL, -- 违规描述
  penalty_points INTEGER DEFAULT 0, -- 处罚积分
  evidence TEXT, -- 证据（图片、文件链接等）
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected', 'appeal_approved', 'appeal_rejected')), -- 状态
  appeal_reason TEXT, -- 申诉理由
  processed_by INTEGER, -- 处理人ID
  processed_at TEXT, -- 处理时间
  notes TEXT, -- 处理备注
  created_by INTEGER NOT NULL, -- 创建人ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

## 处罚机制

### 积分累计规则
- 所有违规行为都会产生相应的处罚积分
- 处罚积分会在违规记录被管理员批准后计入承运商/客户档案

### 处罚等级
1. **0-29分** - 正常运营
2. **30-49分** - 黄色警告，限制部分功能
3. **50-99分** - 橙色警告，限制接单数量
4. **≥100分** - 红色警告，暂停账户

### 处罚措施
- **黄色警告**：发送警告通知，限制新订单接单数量
- **橙色警告**：降低推荐权重，限制高峰期接单
- **红色警告**：暂停账户，禁止接单

## API接口设计

### 1. 查询违规记录
```
GET /api/admin/risk-control/violations
参数: page, limit, violation_type, status, start_date, end_date, target_id
```

### 2. 创建违规记录
```
POST /api/admin/risk-control/violations
请求体: order_id, violation_type, target_type, target_id, description, evidence
```

### 3. 处理违规记录
```
PUT /api/admin/risk-control/violations/{id}/process
请求体: action(approve/reject/appeal_approve/appeal_reject), penalty_points, notes
```

### 4. 承运商申诉
```
POST /api/carrier/violations/{id}/appeal
请求体: reason, evidence
```

### 5. 承运商释放订单（增强版）
```
DELETE /api/carrier/orders/{id}/release
```

## 业务流程

### 违规记录处理流程
1. 系统或管理员创建违规记录
2. 违规记录状态为"pending"等待处理
3. 管理员审核违规记录
   - 批准：执行处罚措施
   - 拒绝：不执行处罚
4. 如涉及处罚，更新承运商/客户处罚积分
5. 根据处罚积分执行相应措施

### 申诉流程
1. 承运商对处罚有异议时可发起申诉
2. 申诉状态为"pending_appeal"
3. 管理员审核申诉
   - 申诉批准：撤销处罚，清零处罚积分
   - 申诉拒绝：维持原处罚

## 管理后台功能

### 违规记录管理
- 查询和筛选违规记录
- 批量处理违规记录
- 生成违规统计报表

### 处罚监控
- 实时监控承运商处罚积分
- 自动执行处罚措施
- 生成处罚通知

### 申诉处理
- 处理承运商申诉
- 审核申诉材料
- 做出申诉决定

## 技术实现要点

### 数据一致性
- 使用数据库事务确保数据一致性
- 违规记录创建和处罚积分更新应在同一事务中

### 性能优化
- 对违规记录表建立适当索引
- 定期归档历史记录

### 安全考虑
- 严格的权限控制
- 操作日志记录
- 防止恶意申诉

## 配置参数

### 可配置项
- 各种违规类型的处罚积分
- 各处罚等级的阈值
- 申诉处理时限
- 自动处罚规则

## 部署建议

1. 更新数据库结构
2. 部署API处理器
3. 更新管理后台界面
4. 配置处罚规则
5. 进行充分测试