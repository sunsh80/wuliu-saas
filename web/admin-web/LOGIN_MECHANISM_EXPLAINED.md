# 物流管理系统 - 登录功能工作原理说明

## 登录功能实现

### 1. 登录页面路径
- 登录页面: `public/login.html`
- 登录成功后跳转到: `public/index.html` (这是管理系统的首页，不是根目录的Vue页面)

### 2. 登录流程
1. 用户在 `login.html` 页面输入用户名和密码
2. 前端向 `/api/admin/login` 发送POST请求
3. 后端验证凭据并返回JWT token
4. 前端收到token后存储到localStorage
5. 页面跳转到 `/admin/index.html` (即 `public/index.html`)

### 3. 关键代码段
在 `login.html` 中的关键跳转代码：
```javascript
if (data && data.data && data.data.token) {
    localStorage.setItem('adminToken', data.data.token);
    showMessage('登录成功！正在跳转...', false);
    
    // 跳转到主页
    setTimeout(() => {
        window.location.href = '/admin/index.html';
    }, 1000);
}
```

### 4. 路径说明
- `/admin/index.html` 实际对应 `public/index.html` 文件
- 这是我们的物流管理系统首页，包含侧边栏导航等功能
- 不是根目录的 `index.html` (Vue.js默认页面)

### 5. 可能的问题及解决方案

#### 问题1: 登录后没有跳转
**原因**: 可能是JavaScript错误阻止了跳转
**解决方案**: 
- 打开浏览器开发者工具 (F12)
- 查看Console标签是否有错误信息
- 检查Network标签确认API请求是否成功

#### 问题2: Token未正确存储
**原因**: 响应格式可能与预期不符
**解决方案**:
- 确认后端返回格式为 `{"data": {"token": "实际token值"}}`
- 检查浏览器localStorage中是否包含adminToken

#### 问题3: 跳转到错误页面
**原因**: 跳转路径可能不正确
**解决方案**:
- 确认跳转路径为 `/admin/index.html`
- 这会加载 `public/index.html` 文件，即管理系统首页

### 6. 验证方法
1. 登录成功后，在浏览器地址栏应看到跳转到 `/admin/index.html`
2. localStorage中应包含adminToken项
3. 页面应显示管理系统首页内容（含侧边栏导航）

### 7. 调试命令
在浏览器控制台中可执行以下命令验证状态：
```javascript
// 检查token是否存在
localStorage.getItem('adminToken')

// 手动跳转到管理首页
window.location.href = '/admin/index.html'

// 检查当前页面路径
window.location.pathname
```

### 8. 重要提醒
- 登录成功后跳转的 `/admin/index.html` 实际就是 `public/index.html`
- 这是物流管理系统首页，包含完整的侧边栏导航和功能模块
- 不是根目录的Vue.js默认页面