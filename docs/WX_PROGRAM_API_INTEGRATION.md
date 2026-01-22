# 小程序前端与后端API集成说明

## 概述

本文档说明了物流小程序前端与后端API的集成方式，包括匿名下单和登录后下单两种模式。

## API端点

### 1. 匿名下单功能

#### 创建公共订单
```
POST /api/public/orders
Content-Type: application/json

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
  "description": "货物描述",
  "shipper_name": "发货人姓名",
  "shipper_phone": "发货人电话",
  "recipient_name": "收货人姓名",
  "recipient_phone": "收货人电话"
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "ORD-1769089859518",
    "tracking_number": "ORD-1769089859518",
    "status": "pending",
    "customer_phone": "13800138000"
  }
}
```

#### 查询公共订单
```
GET /api/public/orders/{orderId_or_phone}
Authentication: None (Public API)

Response:
{
  "success": true,
  "data": {
    "id": "order_123",
    "order_id": "ORD-1769089859518",
    "tracking_number": "ORD-1769089859518",
    "pickup_address": "发货地址",
    "delivery_address": "收货地址",
    "weight_kg": 25.5,
    "volume_m3": 0.8,
    "status": "pending",
    "created_at": "2026-01-22T10:30:00Z",
    "updated_at": "2026-01-22T10:30:00Z",
    "sender_info": {
      "name": "发货人姓名",
      "phone": "发货人电话",
      "address": "发货地址"
    },
    "receiver_info": {
      "name": "收货人姓名",
      "phone": "收货人电话",
      "address": "收货地址"
    },
    "description": "货物描述",
    "customer_phone": "13800138000"
  }
}
```

### 2. 认证用户功能

#### 创建客户订单
```
POST /api/customer/orders
Authentication: TenantSessionAuth
Content-Type: application/json

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
  "description": "货物描述",
  "shipper_name": "发货人姓名",
  "shipper_phone": "发货人电话",
  "recipient_name": "收货人姓名",
  "recipient_phone": "收货人电话"
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "ORD-1769089859518",
    "tracking_number": "ORD-1769089859518",
    "status": "pending"
  }
}
```

#### 获取客户订单列表
```
GET /api/customer/orders
Authentication: TenantSessionAuth

Response:
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "order_id": "ORD-1769089859518",
        "tracking_number": "ORD-1769089859518",
        "pickup_address": "发货地址",
        "delivery_address": "收货地址",
        "weight_kg": 25.5,
        "volume_m3": 0.8,
        "status": "pending",
        "created_at": "2026-01-22T10:30:00Z",
        "sender_info": {...},
        "receiver_info": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

## 前端集成

### 1. 匿名下单流程
1. 用户在小程序前端填写订单信息
2. 前端调用 `/api/public/orders` 创建订单
3. 返回订单号和状态
4. 用户可通过订单号或电话号码查询订单状态

### 2. 登录后下单流程
1. 用户登录后，前端获取认证session
2. 前端调用 `/api/customer/orders` 创建订单
3. 订单与用户账户关联
4. 用户可在"我的"页面查看订单状态

### 3. 订单状态查询
- 匿名用户：通过订单号或电话号码查询
- 登录用户：在"我的"页面查看所有订单

## 安全考虑

1. **匿名订单**: 不关联用户账户，通过电话号码或订单号查询
2. **认证订单**: 通过Session认证，只能查看自己的订单
3. **数据验证**: 前后端均需验证输入数据
4. **隐私保护**: 匿名订单不存储敏感用户信息

## 错误处理

### 通用错误响应
```
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误描述信息",
  "details": "详细错误信息（开发环境）"
}
```

### 常见错误码
- `MISSING_REQUIRED_FIELDS`: 缺少必需字段
- `ORDER_NOT_FOUND`: 订单未找到
- `USER_NOT_FOUND`: 用户未找到
- `UNAUTHORIZED`: 未认证
- `INTERNAL_ERROR`: 服务器内部错误

## 前端实现建议

### 1. 状态管理
- 区分匿名用户和认证用户状态
- 缓存订单查询结果

### 2. 用户体验
- 提供扫码下单功能
- 支持通过电话号码查询订单
- 显示订单状态变化

### 3. 数据同步
- 定期同步订单状态
- 支持下拉刷新
- 离线缓存订单信息

## 后续优化

1. **实时通知**: 集成WebSocket实现实时订单状态更新
2. **地图集成**: 集成地图服务显示订单位置
3. **支付集成**: 集成在线支付功能
4. **评价系统**: 添加订单完成后的评价功能