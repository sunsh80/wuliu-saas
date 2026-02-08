# 物流管理系统 - 部署和启动说明

## 项目状态
✅ API一致性已完全实施
✅ 所有前端页面使用统一API地址
✅ 侧边栏导航已更新
✅ 登录功能正常工作

## 部署步骤

### 1. 环境要求
- Node.js >= 16.0.0
- npm
- 后端服务运行在 `http://192.168.2.250:3000`

### 2. 安装依赖
```bash
cd C:\Users\Administrator\Desktop\wuliu_project\web\admin-web
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```
前端将在 `http://localhost:5173` 启动

### 4. 使用启动脚本
双击 `START_SERVER.BAT` 文件，选择选项 1 启动开发服务器

## API地址一致性

### 当前配置
- **API基础URL**: `http://192.168.2.250:3000/api`
- **所有前端页面**: 使用此统一地址
- **代理配置**: 已在 `vite.config.js` 中配置

### 已更新的页面
- 登录页面: `/login.html`
- 首页: `/index.html`
- 订单管理: `/orders.html`
- 租户管理: `/tenants.html`
- 入驻申请: `/application-list.html`

## 验证步骤

### 1. 启动服务
1. 确保后端服务运行在 `http://192.168.2.250:3000`
2. 启动前端开发服务器: `npm run dev`

### 2. 访问验证页面
- API验证: http://localhost:5173/api-verification.html
- 端点验证: http://localhost:5173/api-endpoint-verification.html

### 3. 测试功能
1. 访问 http://localhost:5173/login.html
2. 尝试登录功能
3. 验证导航到其他页面

## 故障排除

### 常见问题
1. **无法连接API**: 确认后端服务在 `http://192.168.2.250:3000` 运行
2. **登录失败**: 检查后端登录API是否正常
3. **页面加载错误**: 确认前端开发服务器已启动

### 验证命令
```bash
# 检查后端服务
curl http://192.168.2.250:3000/api/health

# 检查前端服务器
curl http://localhost:5173/
```

## 文件变更摘要

### 已更新的文件
- `public/js/api.js` - API基础URL更新
- `public/js/auth.js` - 登录API更新
- `public/js/main.js` - API请求函数更新
- `public/login.html` - 登录请求更新
- `public/index.html` - 导航路径更新
- `public/orders.html` - 导航路径更新
- `public/tenants.html` - 导航路径更新
- `public/application-list.html` - 导航路径更新

### 新增验证页面
- `public/api-verification.html` - API一致性验证
- `public/api-endpoint-verification.html` - 端点验证

## 维护说明

### 更新API地址
如需更改API地址，需更新以下文件：
1. `public/js/api.js`
2. `public/js/auth.js`
3. `public/js/main.js`
4. 相关页面中的硬编码URL

### 验证新功能
每次更新后，使用验证页面确认API一致性。

## 技术支持

如遇问题，请检查：
1. 后端服务是否运行在正确地址
2. 前端开发服务器是否启动
3. 网络连接是否正常
4. 浏览器控制台是否有错误信息