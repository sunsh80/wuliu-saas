# 物流管理系统 - 数据库连接说明

## 概述
本文档介绍如何配置和使用数据库连接功能，以获取现有数据信息并验证连通性。

## 数据库配置

### 1. 环境变量配置
创建 `.env` 文件（基于 `.env.example`）：

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database_name
```

### 2. 数据库类型支持
目前支持 MySQL 数据库，如需其他数据库类型，请修改 `db-connector.js` 中的连接代码。

## 安装依赖

在项目根目录运行：

```bash
npm install mysql2
```

## 数据库连接功能

### 1. 连接测试
- 函数: `testConnection()`
- 功能: 测试数据库连接是否正常
- 返回: Promise<boolean>

### 2. 数据查询功能
- `getAllOrders()` - 获取所有订单数据
- `getAllTenants()` - 获取所有租户数据
- `getPendingTenants()` - 获取待审核租户数据
- `getOrderStats()` - 获取订单统计信息
- `getTenantStats()` - 获取租户统计信息

## 使用方法

### 1. 运行数据库连接测试
```bash
node test-db-connection.js
```

### 2. 在代码中使用
```javascript
const { 
    testConnection, 
    getAllOrders, 
    getOrderStats 
} = require('./db-connector');

async function example() {
    // 测试连接
    const isConnected = await testConnection();
    
    if (isConnected) {
        // 获取订单统计
        const stats = await getOrderStats();
        console.log(stats);
        
        // 获取订单数据
        const orders = await getAllOrders();
        console.log(orders);
    }
}
```

## 数据表结构

### 订单表 (orders)
- id: 订单ID
- tracking_number: 追踪号码
- status: 订单状态
- created_at: 创建时间
- sender_info: 发货人信息
- receiver_info: 收货人信息
- weight_kg: 重量(kg)

### 租户表 (tenants)
- id: 租户ID
- name: 租户名称
- contact_person: 联系人
- contact_phone: 联系电话
- email: 邮箱
- status: 状态 (pending, approved, rejected, active, inactive)
- roles: 角色 (customer, carrier)
- created_at: 创建时间

## 错误处理

### 常见错误
1. **连接错误**: 检查数据库服务是否运行
2. **认证错误**: 检查用户名和密码是否正确
3. **权限错误**: 检查数据库用户权限设置
4. **表不存在**: 检查数据库表结构是否正确

### 错误日志
所有错误信息都会输出到控制台，便于调试。

## 安全注意事项

1. **敏感信息**: 不要在代码中硬编码数据库凭据
2. **环境变量**: 使用环境变量或配置文件管理数据库连接信息
3. **SQL注入**: 使用参数化查询防止SQL注入攻击
4. **连接池**: 合理配置连接池参数，避免资源浪费

## 性能优化

1. **索引**: 在常用查询字段上创建索引
2. **分页**: 对大量数据查询使用分页
3. **连接池**: 合理设置连接池大小
4. **缓存**: 对频繁查询的数据考虑使用缓存

## 部署说明

1. 确保生产环境中数据库服务可访问
2. 配置正确的数据库连接参数
3. 设置适当的连接池参数
4. 监控数据库连接状态

## 故障排除

### 连接问题
- 检查数据库服务是否运行
- 检查防火墙设置
- 检查网络连通性

### 查询问题
- 检查SQL语法
- 检查表结构
- 检查字段名称

### 性能问题
- 检查数据库索引
- 检查查询语句
- 检查连接池配置