# 物流系统多车竞价处理逻辑修正

## 1. 现实场景分析

### 1.1 主要场景
- **不同承运商竞价**：多个承运商对同一客户订单进行报价（主要场景）
- **同一承运商多车竞价**：同一承运商的不同车辆对同一订单进行报价（次要场景）

### 1.2 同一承运商多车竞价的现实情况
- 不同车辆因装载能力、时间安排不同对同一订单竞价
- 车辆距离不同，服务能力不同
- 属于小概率事件，但仍需处理

## 2. 修正后的多车竞价处理逻辑

### 2.1 订单状态流转
```
客户创建订单 → status: 'pending_claim'
多个承运商/车辆认领订单 → status: 'pending_claim', 多个carrier_id/vehicle_id记录
承运商提交报价 → 报价存储在quotes表
客户选择承运商 → status: 'awarded', 确定唯一的carrier_id和vehicle_id
其他报价自动失效
```

### 2.2 数据库设计调整
由于一个订单可能被多个承运商/车辆认领，需要调整数据结构：

#### 2.2.1 orders 表
- 保持原有结构，只记录最终被选择的carrier_id和vehicle_id
- 状态字段表示订单整体状态

#### 2.2.2 新增 order_assignments 表
```sql
CREATE TABLE order_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, -- 订单ID
  carrier_id INTEGER NOT NULL, -- 承运商ID
  vehicle_id INTEGER NOT NULL, -- 车辆ID
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'quoted', 'rejected', 'cancelled')), -- 分配状态
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES tenant_vehicles(id) ON DELETE CASCADE
);
```

#### 2.2.3 quotes 表
- 保持原有结构，通过carrier_id关联报价
- 一个订单可以有多条报价记录

### 2.3 业务逻辑调整

#### 2.3.1 认领订单逻辑
1. 承运商选择车辆认领订单
2. 在order_assignments表中创建记录
3. 订单状态仍为'pending_claim'

#### 2.3.2 提交报价逻辑
1. 承运商为已认领的订单提交报价
2. 报价存储在quotes表中
3. 订单状态仍为'pending_claim'

#### 2.3.3 客户选择逻辑（关键）
1. 客户从所有报价中选择一个
2. 系统更新订单状态为'awarded'
3. 系统更新订单的carrier_id和vehicle_id为选中的
4. 系统更新order_assignments表中其他记录为'rejected'状态
5. 系统减少其他车辆的活跃订单计数

## 3. API接口调整

### 3.1 承运商认领订单
```
POST /api/carrier/orders/{order_id}/assign
请求体: { vehicle_id: number }
```

### 3.2 承运商提交报价
```
POST /api/carrier/orders/{order_id}/quote
请求体: { price: number, delivery_time: string, remarks: string }
```

### 3.3 客户选择承运商（核心逻辑）
在客户选择承运商的API中增加处理逻辑：
1. 更新订单状态和承运商/车辆信息
2. 更新其他分配记录为rejected状态
3. 减少其他车辆的活跃订单计数

## 4. 实现代码示例

### 4.1 客户选择承运商的增强逻辑
```javascript
// 在awardOrderToCarrier处理器中增加以下逻辑
// 1. 更新订单状态和承运商信息
await db.run(`
  UPDATE orders 
  SET status = 'awarded', carrier_id = ?, vehicle_id = ?, updated_at = datetime('now')
  WHERE id = ?
`, [selectedCarrierId, selectedVehicleId, orderId]);

// 2. 更新其他分配记录为rejected状态
await db.run(`
  UPDATE order_assignments 
  SET status = 'rejected', updated_at = datetime('now')
  WHERE order_id = ? AND (carrier_id != ? OR vehicle_id != ?)
`, [orderId, selectedCarrierId, selectedVehicleId]);

// 3. 减少其他车辆的活跃订单计数
await db.run(`
  UPDATE tenant_vehicles 
  SET current_active_orders = MAX(0, current_active_orders - 1), updated_at = datetime('now')
  WHERE id IN (
    SELECT vehicle_id FROM order_assignments 
    WHERE order_id = ? AND status = 'rejected'
  )
`, [orderId]);
```

## 5. 业务价值

### 5.1 提升效率
- 同一承运商可灵活调配多辆车
- 支持不同能力车辆的差异化报价

### 5.2 公平竞争
- 保障不同承运商的公平竞争机会
- 遵循客户选择的最终决定权

### 5.3 系统健壮性
- 正确处理小概率的多车竞价场景
- 遵活应对各种业务情况

## 6. 部署建议

1. 更新数据库结构，增加order_assignments表
2. 调整认领订单的API逻辑
3. 在客户选择承运商的API中增加处理逻辑
4. 更新相关查询逻辑以支持新的数据结构
5. 进行充分测试，特别是多车竞价场景

这样的设计既支持了主要场景（不同承运商竞价），也妥善处理了次要场景（同一承运商多车竞价），确保系统在各种情况下都能正确运行。