# 物流管理系统 - 部署说明

## 开发环境部署

### 1. 前端部署
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
前端将在 `http://localhost:5173` 启动

### 2. 后端部署
```bash
# 在后端项目目录中
npm install
npm run dev
```
后端将在 `http://localhost:3000` 启动

## 生产环境部署

### 1. 构建前端
```bash
npm run build
```
构建产物位于 `dist/` 目录

### 2. 部署前端
将 `dist/` 目录内容部署到Web服务器

### 3. 配置反向代理
配置Web服务器将 `/api` 请求代理到后端服务

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 前端页面
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend-server:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 环境变量配置

### 前端环境变量
创建 `.env.production` 文件：
```
VITE_API_BASE_URL=https://your-domain.com/api
```

### 后端环境变量
确保后端配置允许前端域名访问：
```javascript
// CORS 配置
app.use(cors({
  origin: ['https://your-domain.com', 'http://localhost:5173'],
  credentials: true
}));
```

## 连接配置验证

### 1. 部署后验证步骤
1. 访问前端页面确认正常加载
2. 使用连接验证页面测试API连通性
3. 测试登录功能
4. 验证各管理页面功能

### 2. 常见部署问题
- **CORS错误**: 检查后端CORS配置
- **API请求失败**: 验证代理配置
- **静态资源加载失败**: 检查路径配置
- **登录失败**: 确认认证配置

## 监控和维护

### 1. 连接监控
- 定期检查前端到后端的连通性
- 监控API响应时间
- 检查错误日志

### 2. 性能优化
- 使用CDN加速静态资源
- 实施API缓存策略
- 优化数据库查询

## 故障排除

### 1. 连接问题
- 检查网络连通性
- 验证防火墙设置
- 确认服务端口开放

### 2. 认证问题
- 验证JWT配置
- 检查Cookie设置
- 确认跨域配置

## 安全注意事项

### 1. 生产环境安全
- 使用HTTPS加密传输
- 实施适当的认证授权
- 验证输入数据
- 定期更新依赖

### 2. 配置安全
- 不在代码中硬编码敏感信息
- 使用环境变量管理配置
- 实施访问控制

## 版本更新

### 1. 前端更新
```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建
npm run build

# 部署构建产物
```

### 2. 后端更新
```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 重启服务
pm2 restart app
```

## 支持资源

### 1. 文档
- `README.md` - 项目概述
- `CONNECTION_TROUBLESHOOTING_GUIDE.md` - 故障排除
- `FINAL_CONNECTION_RESOLUTION_REPORT.md` - 解决方案总结

### 2. 联系支持
如遇问题，请参考相关文档或联系技术支持团队。