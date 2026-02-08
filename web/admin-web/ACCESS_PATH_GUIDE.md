# 物流管理系统 - 访问路径说明

## 正确的访问路径

### 开发环境访问方式

#### 1. 启动开发服务器
```bash
cd C:\Users\Administrator\Desktop\wuliu_project\web\admin-web
npm run dev
```

#### 2. 通过浏览器访问（推荐方式）
- **登录页面**: http://localhost:5173/login.html
- **管理首页**: http://localhost:5173/admin/index.html
- **订单管理**: http://localhost:5173/admin/orders.html
- **租户管理**: http://localhost:5173/admin/tenants.html
- **入驻申请**: http://localhost:5173/admin/application-list.html
- **连接验证**: http://localhost:5173/connection-verification.html
- **网络诊断**: http://localhost:5173/network-diagnostic.html

### 重要说明

#### 不要直接打开文件
- ❌ 错误方式: 双击打开 HTML 文件
- ✅ 正确方式: 通过开发服务器访问 URL

#### 为什么需要通过服务器访问
1. **API代理**: 前端请求需要通过开发服务器代理到后端
2. **CORS问题**: 直接打开文件会产生跨域问题
3. **功能完整性**: 某些功能需要服务器环境才能正常工作

### 访问流程

1. **启动后端服务** (确保在 http://192.168.2.250:3000 运行)
2. **启动前端开发服务器**:
   ```bash
   npm run dev
   ```
3. **通过浏览器访问**上述路径之一
4. **不要直接双击HTML文件**

### 常见错误避免

#### 错误的文件路径访问
- ❌ `file:///C:/Users/Administrator/Desktop/wuliu_project/web/admin-web/public/login.html`
- ❌ `C:\Users\Administrator\Desktop\wuliu_project\web\admin-web\public\login.html`

#### 正确的URL访问
- ✅ `http://localhost:5173/login.html`
- ✅ `http://localhost:5173/admin/index.html`

### 功能页面导航

#### 登录后访问
1. 访问: http://localhost:5173/login.html
2. 登录成功后自动跳转到: http://localhost:5173/admin/index.html

#### 侧边栏导航
登录后可通过侧边栏访问:
- 首页 → http://localhost:5173/admin/index.html
- 订单管理 → http://localhost:5173/admin/orders.html
- 客户管理 → http://localhost:5173/admin/customers.html
- 承运商管理 → http://localhost:5173/admin/carriers.html
- 租户管理 → http://localhost:5173/admin/tenants.html
- 报表统计 → http://localhost:5173/admin/reports.html
- 入驻申请 → http://localhost:5173/admin/application-list.html

### 系统工具页面
- 连接验证: http://localhost:5173/connection-verification.html
- 网络诊断: http://localhost:5173/network-diagnostic.html

### 注意事项
- 确保前端开发服务器正在运行 (端口 5173)
- 确保后端服务正在运行 (端口 3000)
- 使用 Chrome/Firefox/Edge 等现代浏览器
- 不要禁用 JavaScript
- 清除浏览器缓存如有需要