# 物流管理系统API接口文档

## 概述

本文档描述了物流管理系统前端与后端的API接口规范，基于已有的OpenAPI规范设计。

## 认证机制

### Session认证
- 所有需要认证的接口都需要在请求中包含session cookie
- 登录后会自动设置 `connect.sid` cookie
- 前端无需手动处理token，由浏览器自动携带cookie

## API端点

### 1. 订单管理

#### 获取订单列表
```
GET /api/customer/orders
Authentication: TenantSessionAuth
Response:
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ORD-123456",
        "customer_tenant_id": "1",
        "customer_tenant_name": "客户名称",
        "carrier_tenant_id": null,
        "carrier_tenant_name": null,
        "pickup_address": "发货地址",
        "delivery_address": "收货地址",
        "weight_kg": 25.5,
        "volume_m3": 0.8,
        "status": "pending",
        "created_at": "2026-01-22T10:30:00Z",
        "quotes": [...]
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 100,
      "per_page": 10
    }
  }
}
```

#### 创建订单
```
POST /api/customer/orders
Authentication: TenantSessionAuth
Request Body:
{
  "pickup_address": "发货地址",
  "delivery_address": "收货地址",
  "weight_kg": 25.5,
  "volume_m3": 0.8,
  "required_delivery_time": "2026-01-25T12:00:00Z",
  "quote_deadline": "2026-01-23T10:00:00Z",
  "customer_name": "客户姓名",
  "customer_phone": "13800138000",
  "description": "货物描述"
}
Response:
{
  "success": true,
  "data": {
    "order_id": "ORD-123456"
  }
}
```

#### 更新订单
```
PUT /api/customer/orders/{orderId}
Authentication: TenantSessionAuth
Request Body:
{
  "pickup_address": "新发货地址",
  "delivery_address": "新收货地址",
  "description": "更新的描述"
}
```

#### 删除订单
```
DELETE /api/customer/orders/{orderId}
Authentication: TenantSessionAuth
```

### 2. 财务管理

#### 财务概览
```
GET /api/finance/overview
Authentication: TenantSessionAuth
Response:
{
  "success": true,
  "data": {
    "total_income": 1248560,
    "total_expense": 845230,
    "net_income": 403330,
    "income_this_month": 125000,
    "expense_this_month": 82000
  }
}
```

#### 交易明细
```
GET /api/finance/transactions
Authentication: TenantSessionAuth
Parameters:
- page: 页码 (默认: 1)
- limit: 每页数量 (默认: 10)
- type: 交易类型 (income|expense|all) (默认: all)
- start_date: 开始日期
- end_date: 结束日期
Response:
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "TRX-123456",
        "order_id": "ORD-123456",
        "customer_supplier": "客户/供应商名称",
        "type": "income",
        "amount": 12500,
        "currency": "CNY",
        "date": "2026-01-22T10:30:00Z",
        "status": "confirmed",
        "notes": "交易备注"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 财务核对
```
POST /api/finance/reconciliation
Authentication: TenantSessionAuth
Request Body:
{
  "period_type": "monthly",  // daily, weekly, monthly, custom
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "reconciliation_type": "all",  // income, expense, balance, all
  "notes": "核对备注信息"
}
Response:
{
  "success": true,
  "data": {
    "reconciliation_id": "REC-123456",
    "status": "completed",
    "summary": {
      "total_records": 150,
      "matched_records": 148,
      "unmatched_records": 2,
      "discrepancies": [...]
    }
  }
}
```

#### 财务报表
```
GET /api/finance/reports
Authentication: TenantSessionAuth
Parameters:
- report_type: daily, weekly, monthly, quarterly, yearly
- start_date: 开始日期
- end_date: 结束日期
Response:
{
  "success": true,
  "data": {
    "report_type": "monthly",
    "period": "2026-01",
    "income_breakdown": {
      "total": 125000,
      "by_category": {
        "domestic_shipping": 80000,
        "international_shipping": 45000
      }
    },
    "expense_breakdown": {
      "total": 82000,
      "by_category": {
        "fuel": 30000,
        "vehicle_maintenance": 15000,
        "staff_salary": 25000,
        "other": 12000
      }
    },
    "net_profit": 43000
  }
}
```

### 3. 承运商管理

#### 获取承运商列表
```
GET /api/admin/tenants
Authentication: AdminSessionAuth
Parameters:
- page: 页码
- limit: 每页数量
- status: 状态过滤
- search: 搜索关键词
Response:
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": 1,
        "name": "承运商名称",
        "contact_person": "联系人",
        "contact_phone": "联系电话",
        "email": "邮箱",
        "status": "active",
        "address": "地址",
        "service_radius_km": 200,
        "capacity_kg": 5000,
        "capacity_m3": 30,
        "base_price_per_km": 2.5,
        "avg_rating": 4.5
      }
    ],
    "pagination": { ... }
  }
}
```

### 4. 用户认证

#### 租户登录
```
POST /api/tenant-web/login
Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}
Response:
{
  "success": true,
  "data": {
    "tenant_id": "1",
    "name": "租户名称",
    "roles": ["customer", "carrier"],
    "type": "tenant"
  }
}
```

#### 租户注册
```
POST /api/tenant-web/register
Request Body:
{
  "name": "租户名称",
  "contact_person": "联系人",
  "contact_phone": "13800138000",
  "email": "user@example.com",
  "password": "password123",
  "roles": ["customer", "carrier"],
  "address": "地址"
}
Response:
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant_id": "1",
    "name": "租户名称",
    "email": "user@example.com",
    "roles": ["customer", "carrier"],
    "status": "active"
  }
}
```

## 错误处理

### 通用错误响应格式
```
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误描述信息"
}
```

### 常见错误码
- `UNAUTHORIZED`: 未认证
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 参数验证失败
- `INTERNAL_ERROR`: 服务器内部错误

## 前端集成建议

### 1. API客户端封装
```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // 订单相关方法
  getOrders() {
    return this.request('/api/customer/orders');
  }

  createOrder(orderData) {
    return this.request('/api/customer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // 财务相关方法
  getFinanceOverview() {
    return this.request('/api/finance/overview');
  }

  performReconciliation(reconData) {
    return this.request('/api/finance/reconciliation', {
      method: 'POST',
      body: JSON.stringify(reconData)
    });
  }
}
```

### 2. 状态管理集成
建议使用Vuex或Pinia管理应用状态，包括：
- 用户认证状态
- 订单数据
- 财务数据
- UI状态（加载中、错误等）

### 3. 路由守卫
实现路由守卫确保只有认证用户才能访问受保护的页面。

## 安全考虑

1. 所有敏感操作都需要认证
2. 输入数据需要验证
3. 防止CSRF攻击（利用session机制）
4. 实现适当的权限控制
5. 敏感数据加密传输

## 性能优化

1. 实现分页加载大量数据
2. 使用缓存减少重复请求
3. 实现懒加载和虚拟滚动
4. 优化图片和其他静态资源