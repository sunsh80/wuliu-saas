# 数据库连接使用示例

## 1. 环境配置

### 安装依赖
```bash
npm install mysql2
```

### 创建环境配置文件
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，设置数据库连接参数
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database_name
```

## 2. 数据库连接测试

### 运行连接测试
```bash
# 测试数据库连接并获取数据
npm run db:test
```

### 预期输出
```
🔍 开始数据库连接测试...

✅ 数据库连接成功！

📊 开始获取数据...

📋 获取订单统计信息...
  总订单数: 150
  待处理订单: 25
  运输中订单: 45
  已完成订单: 80

🏢 获取租户统计信息...
  总租户数: 50
  待审核租户: 5
  已批准租户: 30
  活跃租户: 25

📦 获取最近订单数据...
  显示前 5 条订单:
    1. 订单号: ORD-2023-001, 状态: delivered, 创建时间: 2023-10-15 10:30:00
    2. 订单号: ORD-2023-002, 状态: in_transit, 创建时间: 2023-10-15 11:15:00
    ...

🎉 数据库连接测试完成！所有数据获取成功。
```

## 3. 在代码中使用数据库连接

### 基本用法示例
```javascript
const { 
    testConnection, 
    getAllOrders, 
    getOrderStats,
    getPendingTenants
} = require('./db-connector');

async function example() {
    // 测试连接
    const isConnected = await testConnection();
    
    if (isConnected) {
        // 获取订单统计
        const stats = await getOrderStats();
        console.log('订单统计:', stats);
        
        // 获取订单数据
        const orders = await getAllOrders();
        console.log('订单数量:', orders.length);
        
        // 获取待审核租户
        const pending = await getPendingTenants();
        console.log('待审核租户数量:', pending.length);
    }
}
```

### 在前端页面中使用API
```javascript
// 在前端页面中调用数据库API
async function loadDashboardStats() {
    try {
        // 获取订单统计信息
        const stats = await dbAPI.getOrderStats();
        document.getElementById('totalOrders').textContent = stats.total_orders;
        document.getElementById('pendingOrders').textContent = stats.pending_orders;
        document.getElementById('inTransitOrders').textContent = stats.in_transit_orders;
        document.getElementById('completedOrders').textContent = stats.completed_orders;
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载订单列表
async function loadOrders() {
    try {
        const orders = await dbAPI.getOrders(1, 20);
        displayOrders(orders);
    } catch (error) {
        console.error('加载订单失败:', error);
    }
}

// 加载租户列表
async function loadTenants() {
    try {
        const tenants = await dbAPI.getTenants(1, 20);
        displayTenants(tenants);
    } catch (error) {
        console.error('加载租户失败:', error);
    }
}
```

## 4. 数据库表结构参考

### 订单表 (orders)
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE,
    customer_tenant_id INT,
    sender_info JSON,
    receiver_info JSON,
    weight_kg DECIMAL(10,2),
    status ENUM('created', 'pending_claim', 'claimed', 'quoted', 'awarded', 'in_transit', 'delivered', 'cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 租户表 (tenants)
```sql
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    email VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'active', 'inactive') DEFAULT 'pending',
    roles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 5. 常见问题解决

### 连接问题
- 确保数据库服务正在运行
- 检查数据库连接参数是否正确
- 确认数据库用户有足够权限

### 查询问题
- 检查表名和字段名是否正确
- 确认数据库中存在所需数据
- 验证SQL语句语法

### 权限问题
- 确认数据库用户有读取权限
- 检查防火墙设置
- 验证网络连通性

## 6. 安全注意事项

- 不要在代码中硬编码数据库凭据
- 使用环境变量管理敏感信息
- 实施适当的访问控制
- 定期更新数据库密码
- 使用参数化查询防止SQL注入