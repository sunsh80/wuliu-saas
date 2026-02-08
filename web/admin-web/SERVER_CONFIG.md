# 物流管理系统 - 服务器配置说明

## 部署配置

### Vite 构建配置
本项目使用多页面应用(MPA)模式，包含多个独立的HTML页面：

- `index.html` - Vue.js 应用入口
- `public/index.html` - 物流管理系统首页
- `public/login.html` - 管理员登录页面
- `public/orders.html` - 订单管理页面
- `public/tenants.html` - 租户管理页面
- `public/application-list.html` - 入驻申请管理页面

### 构建命令
```bash
npm run build
```

构建后会在 `dist` 目录生成以下结构：
```
dist/
├── index.html (Vue.js应用)
├── assets/ (Vue.js资源)
├── login.html (登录页面)
├── index.html (管理系统首页)
├── orders.html (订单管理)
├── tenants.html (租户管理)
├── application-list.html (入驻申请)
└── css/, js/ (公共资源)
```

### 服务器配置

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 管理系统相关页面
    location ^~ /admin/ {
        try_files $uri $uri/ /index.html;
    }

    # 登录页面
    location = /login.html {
        try_files $uri /login.html;
    }

    # 入驻申请页面
    location = /application-list.html {
        try_files $uri /application-list.html;
    }

    # 订单管理页面
    location = /orders.html {
        try_files $uri /orders.html;
    }

    # 租户管理页面
    location = /tenants.html {
        try_files $uri /tenants.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend-server:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 默认页面 - 重定向到管理系统首页
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache 配置示例
```apache
<VirtualHost *:80>
    DocumentRoot "/path/to/dist"
    
    # 重写规则
    RewriteEngine On
    
    # API 代理
    RewriteRule ^/api/(.*)$ http://localhost:3000/api/$1 [P,L]
    
    # 管理系统页面
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^admin/.*|login\.html|orders\.html|tenants\.html|application-list\.html$ - [L]
    
    # 默认页面
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [QSA,L]
</VirtualHost>
```

### 路由说明

#### 登录流程
1. 用户访问 `/login.html` 进行登录
2. 登录成功后跳转到 `/admin/index.html` (管理系统首页)
3. 所有管理页面路径以 `/admin/` 开头

#### API 路由
- 前端API请求路径: `/api/admin/...`
- 代理到后端: `http://localhost:3000/api/...`

### 开发环境
运行 `npm run dev` 启动开发服务器：
- 应用地址: http://localhost:5173
- 可直接访问各页面:
  - 登录页: http://localhost:5173/login.html
  - 首页: http://localhost:5173/index.html
  - 订单管理: http://localhost:5173/orders.html
  - 等等...

### 注意事项
1. 所有管理页面共享相同的侧边栏导航和样式
2. 登录状态通过 localStorage 中的 adminToken 管理
3. 所有 API 请求需要包含认证头 Authorization: Bearer {token}
4. 静态资源(CSS, JS, 图片)放在 public 目录下以便所有页面共享