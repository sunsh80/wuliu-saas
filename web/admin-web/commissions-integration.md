# 抽佣管理页面集成完成

## 更新时间
2026-02-19

## 更新内容

### 1. 页面结构统一

已将 `web/admin-web/public/commissions.html` 页面集成到平台管理端的统一导航模式中。

**主要变更：**

#### ✅ 侧边栏导航
- 已包含完整的侧边栏导航菜单
- "抽佣管理" 菜单项高亮显示（`class="active"`）
- 与其他管理页面保持一致的导航结构

#### ✅ 顶部栏
- 统一的管理员信息和退出登录按钮
- 退出登录功能由 `main.js` 统一处理

#### ✅ 页面标题区域
```html
<div class="page-header">
    <h1 class="page-title">抽佣管理</h1>
    <p class="page-description">管理平台抽佣规则与配置</p>
</div>
```

#### ✅ 统一的 JavaScript
- 引用 `/js/main.js` 处理通用逻辑
- 自动检查登录状态
- 统一的退出登录处理
- 页面特定的 JavaScript 代码保留

### 2. 功能增强

#### ✅ 抽佣配置加载
```javascript
async function loadCommissionConfig() {
    // 从 API 加载抽佣配置
    // 自动填充表单字段
}
```

#### ✅ 配置保存
```javascript
async function saveCommissionConfig() {
    // 保存配置到后端
    // API: PUT /api/admin/commissions/config
}
```

#### ✅ 重置功能
```javascript
function resetConfig() {
    // 确认后将配置恢复到上次保存的状态
}
```

### 3. 样式统一

添加了与其他管理页面一致的 CSS 样式：

```css
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.page-description {
    color: #64748b;
    margin-top: 4px;
}
```

### 4. API 集成

#### 获取抽佣配置
```
GET /api/admin/commissions/config
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "config": {
      "platform_rate": 0.05,
      "carrier_rate": 0.03,
      "base_commission_percent": 10.0,
      "min_amount": 0.5,
      "max_amount": 50.0,
      "notes": "默认抽佣规则"
    }
  }
}
```

#### 更新抽佣配置
```
PUT /api/admin/commissions/config
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "platform_rate": 0.06,
  "carrier_rate": 0.04,
  "base_commission_percent": 12.0,
  "min_amount": 0.5,
  "max_amount": 50.0,
  "notes": "调整后的抽佣规则"
}
```

### 5. 页面功能模块

#### 抽佣规则配置
- 平台抽佣比例设置（%）
- 承运商抽佣比例设置（%）
- 最低抽佣金额设置（元）
- 最高抽佣金额设置（元）
- 抽佣说明文本框

#### 分级抽佣配置
- 按订单金额分级显示
- 每级显示平台/承运商抽佣比例
- 支持添加/删除分级（前端 UI 已就绪）

#### 抽佣历史记录
- 表格显示历史抽佣记录
- 显示订单号、金额、抽佣金额、状态等
- 状态标签（已完成/待处理/已失败）

### 6. 文件位置

- 前端页面：`web/admin-web/public/commissions.html`
- 后端 API：`backend/api/handlers/admin/commissions/`
- 数据库模型：`backend/db/models/Commission.js`
- 统一脚本：`web/admin-web/public/js/main.js`

### 7. 使用说明

#### 访问页面
1. 登录管理平台
2. 点击侧边栏 "抽佣管理" 菜单
3. 页面自动加载当前抽佣配置

#### 修改配置
1. 修改表单中的抽佣参数
2. 点击 "保存配置" 按钮
3. 系统提示保存成功

#### 重置配置
1. 点击 "重置" 按钮
2. 确认重置操作
3. 配置恢复到上次保存的状态

### 8. 后续优化建议

1. **分级抽佣功能**
   - 实现添加/删除分级的前端逻辑
   - 后端 API 支持分级配置

2. **数据可视化**
   - 添加抽佣统计图表
   - 显示抽佣趋势

3. **导出功能**
   - 支持导出抽佣记录为 Excel
   - 支持导出配置为 PDF

4. **权限控制**
   - 细化抽佣管理权限
   - 支持操作日志记录

### 9. 相关文件

- 完整文档：`docs/wallet-commission-management.md`
- OpenAPI 定义：`backend/openapi.yaml`（搜索 `/api/admin/commissions`）
- 迁移脚本：`backend/db/migrations/002_add_management_tables.js`

---

## 验证清单

- [x] 侧边栏导航正确显示
- [x] 页面标题样式统一
- [x] 引用 main.js 脚本
- [x] 登录状态检查正常
- [x] 退出登录功能正常
- [x] 抽佣配置加载正常
- [x] 配置保存功能正常
- [x] 重置功能正常
- [x] 页面样式与其他管理页面一致

---

更新完成！✅
