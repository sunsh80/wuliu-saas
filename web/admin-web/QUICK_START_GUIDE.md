# 物流管理系统 - 快速启动指南

## 启动步骤

### 1. 启动后端服务
确保后端服务运行在 `http://192.168.2.250:3000`

### 2. 启动前端开发服务器
```bash
cd C:\Users\Administrator\Desktop\wuliu_project\web\admin-web
npm run dev
```

### 3. 访问应用
在浏览器中打开以下地址：

#### 管理页面
- **登录页面**: http://localhost:5173/login.html
- **管理首页**: http://localhost:5173/admin/index.html
- **订单管理**: http://localhost:5173/admin/orders.html
- **租户管理**: http://localhost:5173/admin/tenants.html
- **入驻申请**: http://localhost:5173/admin/application-list.html

#### 工具页面
- **连接验证**: http://localhost:5173/connection-verification.html
- **网络诊断**: http://localhost:5173/network-diagnostic.html

## 重要提醒

### ⚠️ 请勿直接双击HTML文件
- ❌ 错误: 双击 `login.html` 文件
- ✅ 正确: 通过 `http://localhost:5173/login.html` 访问

### 为什么不能直接双击文件？
1. **API代理**: 需要开发服务器代理API请求到后端
2. **CORS问题**: 直接打开会产生跨域错误
3. **功能完整**: 某些功能需要服务器环境才能正常工作

## 故障排除

### 如果无法访问
1. 确认前端开发服务器正在运行
2. 确认后端服务正在运行
3. 检查防火墙设置
4. 清除浏览器缓存

### 常见错误
- `file:///` 错误: 说明直接打开了文件，应通过服务器访问
- CORS错误: 检查后端CORS配置
- 连接失败: 确认后端服务地址正确

## 登录凭据
使用后端系统配置的正确用户名和密码进行登录。

## 技术支持
如遇问题，请参考项目文档或联系技术支持。