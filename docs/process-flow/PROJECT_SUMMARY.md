# 项目总结报告

## 项目概述
物流管理系统是一个综合性的平台，旨在连接客户、承运商和管理员，实现订单的高效流转和管理。

## 主要功能模块
- 客户下单功能
- 承运商管理功能
- 订单状态跟踪
- 系统管理功能

## 订单流转流程

### 1. 用户登录环节
- 文件：@wx-program/pages/login/login.js, @backend/api/handlers/tenant/loginTenantWeb.js
- 判断条件：邮箱/手机号和密码匹配，或手机号和验证码匹配
- 断点：无有效凭证无法登录

### 2. 订单创建环节
- 文件：@wx-program/pages/order/order.js
- 判断条件：用户登录状态验证
- 断点：如果用户未登录，无法创建订单

### 3. 订单池环节（列表）
- 文件：@backend/api/handlers/public/fetchPublicOrder.js（第一个版本）
- 判断条件：订单状态非'completed'和'cancelled'
- 断点：无明显断点

### 4. 订单详情查询环节
- 文件：@backend/api/handlers/public/fetchPublicOrder.js（第二个版本）
- 判断条件：通过跟踪号或客户电话查询订单
- 断点：无明显断点

### 5. 总后台处置环节
- 文件：@backend/api/handlers/admin/order/updateOrderStatus.js
- 判断条件：有效的订单状态值，包括'pending_claim'（承运商可认领状态）
- 断点：需要管理员权限操作

### 6. 承运商查看订单环节
- 文件：@backend/api/handlers/carrier/order/listCarrierOrders.js
- 判断条件：用户具有'carrier'角色，订单状态为'pending_claim'、'claimed'或'quoted'
- 断点：需要承运商角色权限

### 7. 承运商认领订单环节
- 文件：@backend/api/handlers/carrier/order/claimCarrierOrder.js
- 判断条件：用户具有'carrier'角色，订单状态为'pending_claim'，且未被其他承运商认领
- 断点：需要承运商角色权限，订单需处于'pending_claim'状态

### 8. 承运商报价环节
- 文件：@backend/api/handlers/carrier/order/submitCarrierQuote.js
- 判断条件：用户具有'carrier'角色，订单状态为'pending_claim'或'claimed'，且为指定承运商
- 断点：需要承运商角色权限

### 9. 客户查看报价环节
- 文件：@wx-program/pages/orderTrack/orderTrack.js
- 判断条件：客户登录后，订单状态为'quoted'
- 断点：需要客户登录才能查看报价

### 10. 客户选择承运商环节
- 文件：@wx-program/pages/orderTrack/orderTrack.js, @backend/api/handlers/customer/order/awardOrderToCarrier.js
- 判断条件：客户登录，订单状态为'quoted'，客户选择承运商
- 断点：需要客户登录并主动选择

### 11. 承运执行环节
- 文件：@backend/api/handlers/carrier/order/updateOrderStatus.js, @backend/api/handlers/carrier/order/startDelivery.js
- 判断条件：承运商登录，订单状态为'in_transit'
- 断点：需要承运商登录并更新订单状态

### 12. 订单完成环节
- 文件：@backend/api/handlers/carrier/order/completeCarrierOrder.js
- 判断条件：承运商登录，订单状态为'in_transit'，承运商完成配送
- 断点：需要承运商登录并更新订单状态为'delivered'

### 13. 客户查询历史订单环节
- 文件：@wx-program/pages/orderTrack/orderTrack.js
- 判断条件：客户登录后，可以查询已完成（'delivered'）或取消（'cancelled'）的订单
- 断点：需要客户登录才能查询自己的历史订单

## 技术栈
- 前端：微信小程序
- 后端：Node.js + Express
- 数据库：SQLite

## 当前状态
项目正在开发中，核心功能已实现。