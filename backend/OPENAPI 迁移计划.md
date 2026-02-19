# OpenAPI 处理器统一迁移计划

## 目标
将所有 API 端点统一通过 OpenAPI 处理器处理，确保开发的一致性和对齐。

## 当前状态

### 已使用 OpenAPI 处理器的 API
- ✅ `/api/carrier/stop-points/*` - 承运商停靠点管理
- ✅ `/api/wallet/*` - 钱包管理
- ✅ 所有 handlers 目录下的处理器

### 仍使用传统路由的 API
- ❌ `/api/tenant-web/vehicles/*` - 承运商车辆管理
- ❌ `/api/admin/management/*` - 运营管理（violations, commissions, settings, vehicle-tracking）

## 迁移步骤

### 第一步：创建 OpenAPI 兼容的 Handler

#### 1.1 承运商车辆管理 Handler
需要创建以下文件：

**backend/api/handlers/tenant-web/vehicles/listVehicles.js**
```javascript
// 从 Express 风格转换为 OpenAPI 风格
const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const tenantId = c.session?.tenantId;
  if (!tenantId) {
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const { page = 1, limit = 10, search, status } = c.request.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const db = getDb();
  // ... 查询逻辑
  return { status: 200, body: { success: true, data: { vehicles, pagination } } };
};
```

**backend/api/handlers/tenant-web/vehicles/createVehicle.js**
**backend/api/handlers/tenant-web/vehicles/getVehicle.js**
**backend/api/handlers/tenant-web/vehicles/updateVehicle.js**
**backend/api/handlers/tenant-web/vehicles/deleteVehicle.js**
**backend/api/handlers/tenant-web/vehicle-models/listAvailableModels.js**

#### 1.2 运营管理 Handler

**backend/api/handlers/admin/violations/listViolations.js** (已存在，检查格式)
**backend/api/handlers/admin/violations/getViolation.js**
**backend/api/handlers/admin/violations/createViolation.js** (已存在)
**backend/api/handlers/admin/violations/updateViolation.js** (已存在)
**backend/api/handlers/admin/violations/deleteViolation.js** (已存在)
**backend/api/handlers/admin/violations/getStats.js**

**backend/api/handlers/admin/commissions/getConfig.js**
**backend/api/handlers/admin/commissions/updateConfig.js**
**backend/api/handlers/admin/commissions/listRecords.js**
**backend/api/handlers/admin/commissions/updateRecordStatus.js**

**backend/api/handlers/admin/settings/listSettings.js**
**backend/api/handlers/admin/settings/updateSetting.js**

**backend/api/handlers/admin/vehicle-tracking/getPositions.js**
**backend/api/handlers/admin/vehicle-tracking/getLatestPositions.js**

### 第二步：更新 OpenAPI 规范

在 `backend/openapi.yaml` 中添加缺失的 API 端点定义：

```yaml
paths:
  /api/tenant-web/vehicles:
    get:
      tags:
        - carrier-vehicle
      summary: 获取承运商车辆列表
      operationId: listVehicles
      security:
        - TenantSessionAuth: []
      # ... parameters and responses
  
  /api/admin/violations:
    get:
      tags:
        - admin-violation
      summary: 违规列表
      operationId: listViolations
      # ...
```

### 第三步：移除传统路由

#### 3.1 删除/弃用路由文件
- ❌ 删除 `backend/api/routes/tenant-web/vehicles.js`
- ❌ 删除 `backend/api/routes/admin/management-routes.js`

#### 3.2 更新 server.js
移除传统路由注册：
```javascript
// 删除以下代码
// const tenantVehiclesRouter = require('./api/routes/tenant-web/vehicles');
// app.use('/api/tenant-web/vehicles', tenantVehiclesRouter);
```

### 第四步：验证和测试

1. 启动服务器
2. 检查日志确认所有 handler 已注册
3. 测试所有 API 端点
4. 确认前端页面正常工作

## 执行顺序

1. ✅ **第一步**：创建所有缺失的 OpenAPI Handler
2. ✅**第二步**：更新 OpenAPI 规范添加路径定义
3. ✅**第三步**：验证新 Handler 工作正常
4. ✅**第四步**：移除传统路由文件
5. ✅**第五步**：清理 server.js 中的路由注册
6. ✅**第六步**：最终验证和测试

## 预期结果

- ✅ 所有 API 请求都通过 OpenAPI 处理器处理
- ✅ 统一的认证和授权机制
- ✅ 统一的请求/响应格式
- ✅ 统一的错误处理
- ✅ 更好的可维护性和扩展性

## 时间估算

- 第一步：2 小时
- 第二步：1 小时
- 第三步：1 小时
- 第四步：0.5 小时
- 第五步：0.5 小时
- 第六步：1 小时

**总计：约 6 小时**
