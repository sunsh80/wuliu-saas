# 订单录入页面功能扩展需求分析文档

## 1. 功能需求概述

### 1.1 发货人信息自动填充
- **需求**：登录后自动获取用户手机号并填充到发货人联系方式
- **可编辑性**：允许用户修改发货人信息
- **智能识别**：根据用户历史订单自动填充常用发货人信息

### 1.2 临时保存功能（混合方案）
- **自动保存**：用户停止输入3秒后自动保存草稿
- **手动保存**：保留"暂存草稿"按钮供用户主动保存
- **状态提示**：页面显示"草稿已保存"状态
- **草稿箱**：在个人中心维护草稿箱，用户可随时恢复未完成订单

### 1.3 地址库功能
- **地址管理**：在个人中心页面添加"地址管理"功能
- **常用地址**：支持添加、编辑、删除常用地址
- **地址分类**：区分发货地址和收货地址
- **快速选择**：在订单录入页面提供地址选择功能

### 1.4 时间选择优化
- **简化时间选择**：不使用滚动窗口，仅提供天-小时-分的选择
- **默认设置**：取货时间默认为"今年今天"，送达时间默认为"今年今天"
- **时间格式**：显示为"MM-DD HH:mm"格式（如：02-06 14:30）
- **快速选择**：提供"今天"、"明天"等快捷选项

## 2. 现有系统支持情况分析

### 2.1 数据库支持情况
- **订单表** (`orders`)：支持基本订单信息存储
- **地址信息**：通过 `sender_info` 和 `receiver_info` JSON字段存储，但无独立地址库
- **时间字段**：支持时间存储（`created_at`, `required_delivery_time`等）

### 2.2 API支持情况
- **订单API**：支持订单创建、查询等基本功能
- **地址管理API**：❌ 缺失
- **草稿管理API**：❌ 缺失

## 3. 需要新增的数据库结构

### 3.1 草稿订单表
```sql
CREATE TABLE IF NOT EXISTS draft_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_tenant_id INTEGER NOT NULL,
  draft_data TEXT NOT NULL, -- JSON格式存储草稿数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);
```

### 3.2 地址库表
```sql
CREATE TABLE IF NOT EXISTS customer_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_tenant_id INTEGER NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  address_type TEXT DEFAULT 'both' CHECK (address_type IN ('pickup', 'delivery', 'both')),
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);
```

## 4. 需要新增的API端点

### 4.1 草稿相关API
- `POST /api/customer/orders/draft` - 保存草稿
- `GET /api/customer/orders/draft` - 获取草稿列表
- `GET /api/customer/orders/draft/{id}` - 获取特定草稿
- `DELETE /api/customer/orders/draft/{id}` - 删除草稿

### 4.2 地址库相关API
- `POST /api/customer/addresses` - 添加地址
- `GET /api/customer/addresses` - 获取地址列表
- `PUT /api/customer/addresses/{id}` - 更新地址
- `DELETE /api/customer/addresses/{id}` - 删除地址

## 5. 前端页面改造需求

### 5.1 订单录入页面 (`order.js`)
- **数据结构扩展**：新增草稿和地址相关数据字段
- **生命周期函数**：添加草稿恢复逻辑
- **事件处理函数**：新增自动保存和手动保存功能
- **时间选择函数**：替换为简化的时间选择逻辑

### 5.2 个人中心页面 (`my.js`)
- **地址管理入口**：添加地址管理功能入口

### 5.3 地址管理页面 (`addressManage.js`)
- **新建页面**：创建地址管理页面
- **CRUD功能**：实现地址的增删改查功能

## 6. 实施优先级

### 6.1 高优先级（必须实现）
- 地址库表和API
- 草稿表和API
- 订单录入页面的时间选择优化

### 6.2 中优先级（推荐实现）
- 地址选择功能
- 自动保存功能

### 6.3 低优先级（可选实现）
- 智能推荐功能
- 高级地址管理功能

## 7. 技术实现要点

### 7.1 小程序特性考虑
- **页面层级**：避免过多页面跳转，使用模态选择
- **数据存储**：合理使用本地存储和服务器存储
- **性能优化**：避免频繁的网络请求

### 7.2 用户体验优化
- **操作便捷性**：减少用户输入步骤
- **数据安全性**：确保用户数据安全
- **错误处理**：友好的错误提示和恢复机制

## 8. 风险评估

### 8.1 技术风险
- **数据库迁移**：新增表结构可能影响现有功能
- **API兼容性**：新增API需要确保向后兼容

### 8.2 业务风险
- **用户习惯**：新功能可能需要用户适应期
- **数据迁移**：历史数据可能需要适配新结构

## 9. 实施计划

### 9.1 第一阶段：数据库和API开发
- 新增草稿表和地址库表
- 开发相关API端点

### 9.2 第二阶段：前端页面开发
- 改造订单录入页面
- 开发地址管理页面

### 9.3 第三阶段：测试和优化
- 功能测试
- 用户体验优化
- 性能调优

---

**文档版本**：v1.0  
**创建日期**：2026年2月6日  
**状态**：待实施