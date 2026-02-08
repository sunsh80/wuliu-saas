# 物流管理系统 - 后端服务启动指南

## 问题描述
登录页面无法跳转，可能是因为后端API服务未启动或API端点不可用。

## 解决方案

### 1. 确保后端服务正在运行
在使用前端登录功能之前，必须确保后端服务已启动并正在监听相应端口。

### 2. 启动后端服务
通常，后端服务应该在端口 3000 上运行。启动方法取决于您的后端实现：

#### Node.js 后端
```bash
cd /path/to/backend
npm install
npm run dev
```

#### Python Flask/Django 后端
```bash
cd /path/to/backend
pip install -r requirements.txt
python app.py  # 或 python manage.py runserver
```

#### Java Spring Boot 后端
```bash
cd /path/to/backend
mvn spring-boot:run  # 或 ./gradlew bootRun
```

### 3. 验证后端服务
启动后端服务后，可通过以下方式验证：

1. 访问 `http://localhost:3000/health` 或类似健康检查端点
2. 使用API测试工具（如Postman）测试 `/api/admin/login` 端点
3. 使用我们提供的测试页面: `http://localhost:5173/api-test.html`

### 4. API 端点说明
前端登录页面向以下端点发送请求：
- **登录端点**: `POST /api/admin/login`
- **请求格式**: JSON `{ "username": "...", "password": "..." }`
- **响应格式**: JSON `{ "data": { "token": "..." } }`

### 5. 前端配置
当前端开发服务器运行在 5173 端口时，Vite 代理会将 `/api` 请求转发到 `http://localhost:3000`。

### 6. 常见问题排查
1. **CORS 错误**: 确保后端允许来自 `http://localhost:5173` 的跨域请求
2. **网络连接错误**: 检查后端服务是否在正确端口运行
3. **认证失败**: 确保用户名和密码正确
4. **Token 问题**: 检查后端返回的token格式是否符合预期

### 7. 测试登录功能
1. 启动后端服务（端口 3000）
2. 启动前端开发服务器（端口 5173）: `npm run dev`
3. 访问 `http://localhost:5173/api-test.html` 进行API连接测试
4. 测试成功后，再访问 `http://localhost:5173/login.html` 进行登录

### 8. 使用测试页面
我们提供了专门的API测试页面 (`/api-test.html`)，可以帮助您：
- 测试服务器连接
- 测试登录API
- 测试认证API
- 检查当前Token状态

按照以上步骤操作后，登录功能应该可以正常工作并正确跳转到管理页面。