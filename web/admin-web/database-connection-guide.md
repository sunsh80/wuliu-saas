# 物流管理系统 - 数据库连接说明

## 数据库架构概述

物流管理系统使用关系型数据库存储业务数据，主要包括以下实体：

### 主要数据表
1. **users** - 用户表（管理员、客户、承运商）
2. **tenants** - 租户表（客户和承运商信息）
3. **orders** - 订单表
4. **order_status_history** - 订单状态历史记录
5. **customers** - 客户详细信息
6. **carriers** - 承运商详细信息
7. **locations** - 地址位置信息
8. **vehicles** - 车辆信息（承运商）

## 数据库连接配置

### 后端数据库连接
数据库连接应在后端服务中实现，前端不应直接连接数据库。

#### 推荐的后端技术栈
- **Node.js**: 使用 mysql2 或 pg 包连接 MySQL/PostgreSQL
- **Python**: 使用 PyMySQL 或 psycopg2
- **Java**: 使用 JDBC 驱动

#### 数据库连接示例 (Node.js)
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'admin_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  database: process.env.DB_NAME || 'logistics_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### 前端与后端通信
前端通过 RESTful API 与后端通信，后端负责数据库操作：

```javascript
// 前端 API 请求示例
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('未找到管理员Token，请重新登录');
  }

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`/api${path}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login.html';
      return;
    }
    throw new Error(`请求失败: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

## 数据库安全最佳实践

### 1. 连接安全
- 使用 SSL/TLS 加密数据库连接
- 实施强密码策略
- 定期轮换数据库凭证

### 2. 访问控制
- 为不同应用组件创建专用数据库用户
- 实施最小权限原则
- 使用连接池管理数据库连接

### 3. SQL 注入防护
- 使用参数化查询
- 验证和清理所有用户输入
- 使用 ORM 框架（如 Sequelize、TypeORM）

## API 设计规范

### 认证与授权
- 使用 JWT Token 进行身份验证
- 实现 RBAC（基于角色的访问控制）
- 所有 API 请求需携带有效的认证头

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误处理
```json
{
  "success": false,
  "error": "错误信息",
  "code": 400
}
```

## 数据库性能优化

### 索引策略
- 在经常查询的字段上创建索引
- 为外键关系建立索引
- 定期审查和优化索引

### 查询优化
- 避免 SELECT *
- 使用分页查询大数据集
- 实施缓存策略（Redis）

## 部署建议

### 开发环境
- 使用 Docker 容器化数据库
- 配置环境变量管理数据库连接

### 生产环境
- 使用云数据库服务（如 AWS RDS、Azure DB）
- 实施备份和恢复策略
- 监控数据库性能指标

## 连接测试

要测试数据库连接，可以使用以下代码片段：

```javascript
// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}
```

## 故障排除

常见问题及解决方案：
1. **连接超时**: 检查防火墙设置和网络连通性
2. **认证失败**: 验证用户名和密码
3. **权限不足**: 检查数据库用户权限设置
4. **连接池耗尽**: 调整连接池大小参数