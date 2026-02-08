# 物流管理系统 - 连接故障排除指南

## 问题概述
前端无法连接到后端服务器，尽管后端服务已启动。

## 诊断步骤

### 1. 验证后端服务状态
```bash
# 检查端口是否被占用
netstat -an | grep 3000

# 或使用 PowerShell
Get-NetTCPConnection -LocalPort 3000
```

### 2. 直接访问后端
在浏览器中访问：
```
http://localhost:3000/health
```
或使用 curl：
```bash
curl http://localhost:3000/health
```

### 3. 检查前端开发服务器配置
确认 `vite.config.js` 中的代理配置：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## 常见问题及解决方案

### 问题1: 后端服务未在预期端口运行
**症状**: 无法连接到 http://localhost:3000
**解决方案**:
1. 检查后端服务实际运行端口
2. 修改前端代理配置以匹配实际端口
3. 或重新启动后端服务到正确端口

### 问题2: CORS 错误
**症状**: 浏览器控制台显示跨域错误
**解决方案**:
1. 在后端启用CORS，允许前端域名
2. 示例 (Express.js):
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
```

### 问题3: 代理配置错误
**症状**: 请求发送到错误的地址
**解决方案**:
1. 确认 vite.config.js 中的代理设置
2. 检查路径重写规则是否正确
3. 重启前端开发服务器

### 问题4: 防火墙或网络问题
**症状**: 连接被拒绝或超时
**解决方案**:
1. 检查防火墙设置
2. 确认没有网络代理干扰
3. 尝试使用 127.0.0.1 替代 localhost

## 调试方法

### 1. 浏览器开发者工具
1. 打开 F12 开发者工具
2. 查看 Network 标签页
3. 检查 API 请求的状态和响应

### 2. 前端控制台日志
在浏览器控制台中检查错误信息：
```javascript
// 检查当前页面的 origin
console.log(window.location.origin);

// 测试 fetch 请求
fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### 3. 后端日志
检查后端服务器日志，确认是否收到请求。

## 修复步骤

### 步骤1: 确认后端服务
1. 确认后端服务在正确端口运行
2. 验证后端健康检查端点可访问

### 步骤2: 检查前端配置
1. 验证 vite.config.js 代理设置
2. 确认 package.json 中的开发脚本

### 步骤3: 测试连接
1. 使用 network-diagnostic.html 进行完整诊断
2. 检查各项连接指标

### 步骤4: 验证修复
1. 重启前端开发服务器
2. 测试登录功能
3. 验证API调用是否正常

## 预防措施

### 1. 标准化配置
- 使用环境变量管理服务器地址
- 统一前后端通信协议

### 2. 监控和日志
- 实施连接状态监控
- 记录详细的错误日志

### 3. 文档化
- 记录服务依赖关系
- 提供清晰的部署说明

## 紧急修复方案

如果常规方法无效，可尝试：

1. 完全重启前后端服务
2. 清除浏览器缓存和本地存储
3. 检查是否有其他进程占用了端口
4. 使用 IP 地址替代域名 (127.0.0.1:3000)

## 联系支持

如果问题持续存在：
1. 收集浏览器控制台错误信息
2. 提供后端服务日志
3. 记录网络诊断工具的结果
4. 联系技术支持团队