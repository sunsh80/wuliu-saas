# 地图维护功能增容记录

## 日期
2026 年 2 月 19 日

## 需求来源
map-Management.txt

## 需求摘要
实现地图维护功能，包括管理员和承运商两个角色的停靠点管理功能。

### Admin 端（平台管理员）
- 接受承运商提交的停靠点申请
- 导入第三方停靠点 API 接口（可以缺省）
- 管理功能：新建、修改、停用/启用、删除

### Carrier 端（承运商）
- 承运商可以提交、修改、删除停靠点
- 3 天以后不能删除已经提交的停靠点

## 已完成的 API 端点

### 承运商停靠点管理 API
- `/api/carrier/stop-points` (GET) - 获取承运商停靠点列表
- `/api/carrier/stop-points` (POST) - 承运商创建停靠点
- `/api/carrier/stop-points/{id}` (GET) - 获取停靠点详情
- `/api/carrier/stop-points/{id}` (PUT) - 更新停靠点
- `/api/carrier/stop-points/{id}` (DELETE) - 删除停靠点

### 管理员停靠点管理 API（已存在）
- `/api/admin/stop-points` - 管理员停靠点列表
- `/api/admin/stop-points/{id}/approve` - 审批停靠点
- `/api/admin/stop-points/pending` - 待审批列表
- `/api/admin/stop-points/stats` - 审批统计
- `/api/admin/stop-points/batch-import` - 批量导入
- `/api/admin/stop-points/batch-approve` - 批量审批
- `/api/admin/stop-points/{id}` - 获取/更新/删除停靠点
- `/api/admin/stop-points/create` - 创建停靠点

## 已创建的处理器文件

### 承运商处理器
- `backend/api/handlers/carrier/carrierCreateStopPoint.js` - 创建停靠点
- `backend/api/handlers/carrier/carrierListStopPoints.js` - 列表查询
- `backend/api/handlers/carrier/carrierGetStopPoint.js` - 获取详情
- `backend/api/handlers/carrier/carrierUpdateStopPoint.js` - 更新停靠点
- `backend/api/handlers/carrier/carrierDeleteStopPoint.js` - 删除停靠点（3 天限制）

### 管理员处理器（已存在）
- `backend/api/handlers/admin/adminListStopPoints.js`
- `backend/api/handlers/admin/adminCreateStopPoint.js`
- `backend/api/handlers/admin/adminGetStopPoint.js`
- `backend/api/handlers/admin/adminUpdateStopPoint.js`
- `backend/api/handlers/admin/adminDeleteStopPoint.js`
- `backend/api/handlers/admin/adminApproveStopPoint.js`
- `backend/api/handlers/admin/adminListPendingStopPoints.js`
- `backend/api/handlers/admin/adminBatchApproveStopPoints.js`
- `backend/api/handlers/admin/adminBatchImportStopPoints.js`

## 数据库表更新

### stop_points 表字段
- `id` - 主键
- `name` - 停靠点名称
- `address` - 停靠点地址
- `lat` - 纬度
- `lng` - 经度
- `type` - 类型 (residential, commercial, industrial, other)
- `region` - 区域
- `status` - 状态 (active, inactive, maintenance)
- `capacity` - 容量
- `description` - 描述
- `tenant_id` - 所属租户 ID
- `carrier_tenant_id` - 承运商租户 ID（新增）
- `uploaded_by` - 上传者用户 ID
- `upload_source` - 上传来源 (manual, carrier, tenant, import)
- `approval_status` - 审批状态 (pending, approved, rejected)
- `approved_by` - 审批人用户 ID
- `approved_at` - 审批时间
- `rejection_reason` - 驳回原因
- `created_at` - 创建时间
- `updated_at` - 更新时间

## OpenAPI 更新

### 新增 Tags
- `admin-stop-point` - 平台管理员 - 停靠点管理
- `carrier-stop-point` - 承运商 - 停靠点管理

### 新增 Schemas
- `StopPoint` - 添加了审批相关字段：
  - `tenant_id`
  - `carrier_tenant_id`
  - `uploaded_by`
  - `upload_source`
  - `approval_status`
  - `approved_by`
  - `approved_at`
  - `rejection_reason`
  - `created_at`
  - `updated_at`

### 新增 API 路径
- `/api/carrier/stop-points` (GET, POST)
- `/api/carrier/stop-points/{id}` (GET, PUT, DELETE)

## 业务规则

### 承运商创建停靠点
- 必须填写：name, address, lat, lng
- 坐标范围限制：lat (-90~90), lng (-180~180)
- 创建后自动设置为 `pending` 审批状态
- 需要管理员审批后才能启用

### 承运商更新停靠点
- 已批准的停靠点不能修改（返回 403）
- 修改后如需重新审批，自动设置为 `pending` 状态

### 承运商删除停靠点
- 提交超过 3 天的停靠点不能删除（返回 403）
- 只能删除自己创建的停靠点

## 文件备份
- OpenAPI 文件已自动更新
- 数据库表结构已通过脚本更新

## 后续工作
1. ✅ 前端导航栏配置（admin 和 tenant-web）
2. ✅ 前端停靠点管理页面开发
3. 第三方停靠点 API 接口集成（可选）

## 页面访问地址

### Admin 端
- 仪表板：http://localhost:3000/admin-web/dashboard.html
- 地图服务管理：http://localhost:3000/admin-web/map-management.html
- 停靠点管理：http://localhost:3000/admin-web/stop-points.html
- 车辆追踪：http://localhost:3000/admin-web/vehicle-tracking.html

### Carrier 端（承运商）
- 控制台：http://localhost:3000/tenant-web/carrier-dashboard.html
- 停靠点管理：http://localhost:3000/tenant-web/carrier-stop-points.html
- 地图服务：http://localhost:3000/tenant-web/map.html

## 功能说明

### Admin 端功能
1. **地图服务管理页面** (`map-management.html`)
   - 地理编码查询
   - 逆地理编码查询
   - 路径规划
   - 距离计算
   - POI 搜索
   - 停靠点查询

2. **停靠点管理页面** (`stop-points.html`)
   - 查看所有停靠点列表
   - 审批承运商提交的停靠点
   - 批量审批/驳回
   - 新增/编辑/删除停靠点
   - 批量导入停靠点

### Carrier 端功能
1. **停靠点管理页面** (`carrier-stop-points.html`)
   - 查看自己创建的停靠点列表
   - 提交新的停靠点申请
   - 编辑待审批或被驳回的停靠点
   - 删除 3 天内的停靠点
   - 按类型和审批状态筛选

## 业务规则

### 承运商提交停靠点
- 必填字段：名称、地址、纬度、经度
- 坐标范围：纬度 -90~90，经度 -180~180
- 提交后自动设置为 `pending`（待审批）状态
- 需要管理员审批后才能启用

### 承运商修改停靠点
- 只能编辑 `pending` 或 `rejected` 状态的停靠点
- `approved`（已通过）状态的停靠点不能修改

### 承运商删除停靠点
- 只能删除自己创建的停靠点
- 提交超过 3 天的停靠点不能删除
- 删除前会弹出确认提示
