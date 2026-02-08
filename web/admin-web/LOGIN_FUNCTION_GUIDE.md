# 物流管理系统 - 登录功能说明

## 登录流程

### 1. 登录页面功能
- 用户在登录页面输入用户名和密码
- 前端向后端API发送登录请求
- 后端验证凭据并返回认证令牌
- 前端存储令牌并跳转到管理页面

### 2. API请求
- **URL**: `/api/admin/login`
- **方法**: `POST`
- **请求体**: `{"username": "...", "password": "..."}`
- **成功响应**: `{"data": {"token": "jwt_token_here"}}`
- **失败响应**: `{"error": "错误信息"}`

### 3. 跳转逻辑
登录成功后，页面会：
1. 将JWT令牌存储到localStorage（键名为`adminToken`）
2. 显示成功消息
3. 1秒后自动跳转到 `/admin/index.html`（即 `public/index.html`）

## 前端配置

### 1. 代理配置
在 `vite.config.js` 中配置了API代理：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

### 2. 认证头
所有需要认证的API请求都会自动添加：
```
Authorization: Bearer {token}
```

## 常见问题排查

### 1. 登录后不跳转
可能原因：
- 后端服务未运行
- API响应格式不符合预期
- JavaScript错误阻止了跳转

### 2. 检查方法
1. 打开浏览器开发者工具
2. 查看Console标签页是否有错误
3. 查看Network标签页检查API请求响应

### 3. 验证步骤
1. 确认后端服务在 `http://localhost:3000` 运行
2. 确认 `/api/admin/login` 端点可用
3. 确认响应格式为 `{"data": {"token": "..."}}`
4. 确认用户名密码正确

## 调试技巧

### 1. 控制台日志
登录页面包含调试日志，可在控制台查看：
- 登录响应数据
- Token保存状态
- 跳转执行情况

### 2. 手动测试
可在控制台执行以下命令检查状态：
```javascript
// 检查是否已登录
console.log(localStorage.getItem('adminToken'));

// 手动跳转
window.location.href = '/admin/index.html';
```

## 文件说明
- `public/login.html` - 主登录页面
- `public/login-simple.html` - 简化版登录页面（用于测试）
- `public/index.html` - 登录后跳转的目标页面
- `vite.config.js` - 开发服务器配置

## 注意事项
1. 登录凭据需要与后端配置匹配
2. JWT令牌有时效性，过期后需要重新登录
3. 所有管理页面都需要有效的认证令牌