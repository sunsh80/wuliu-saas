# OpenAPI 严格模式问题汇总

**创建时间:** 2026-02-22  
**状态:** 待处理

---

## 核心问题

启用 OpenAPI 严格模式后，发现 **28 个 handler** 未在 `openapi.yaml` 中定义。

**配置文件:** `backend/config/index.js`
```javascript
openapi: {
  definition: './openapi.yaml',
  strict: true,  // 启用严格模式
  validate: true,
}
```

---

## 已完成的修复

1. ✅ 启用 OpenAPI 严格模式
2. ✅ 删除重复 handler：`adminGetApprovalStats.js`（与 `adminStopPointsStats` 功能重复）
3. ✅ 添加端点定义：`GET /api/admin/stop-points/{id}` → `adminGetStopPoint`
4. ✅ 修复平台端待审批列表不显示数据的问题
5. ✅ 修复管理员审批停靠点接口
6. ✅ 添加承运商端停靠点查看详情功能
7. ✅ 添加停靠点草稿箱功能
8. ✅ 数据库文件已提交到版本控制

---

## 待处理的 28 个未定义 handler

### admin 目录 (20 个)

| Handler | 功能 | 前端是否使用 | 处理方案 |
|---------|------|-------------|---------|
| `getCommissionConfig` | 获取佣金配置 | 待确认 | 待决定 |
| `listCommissionRecords` | 佣金记录列表 | 待确认 | 待决定 |
| `updateCommissionConfig` | 更新佣金配置 | 待确认 | 待决定 |
| `updateCommissionRecordStatus` | 更新佣金记录状态 | 待确认 | 待决定 |
| `listServiceProviders` | 服务提供商列表 | 待确认 | 待决定 |
| `listSettings` | 设置列表 | 待确认 | 待决定 |
| `listSystemSettings` | 系统设置列表 | 待确认 | 待决定 |
| `setConfigValue` | 设置配置值 | 待确认 | 待决定 |
| `updateServiceProvider` | 更新服务提供商 | 待确认 | 待决定 |
| `updateSetting` | 更新设置 | 待确认 | 待决定 |
| `updateSystemSetting` | 更新系统设置 | 待确认 | 待决定 |
| `createVehicleModel` | 创建车型 | 待确认 | 待决定 |
| `getLatestPositions` | 获取最新位置 | 待确认 | 待决定 |
| `getVehiclePositions` | 获取车辆位置 | 待确认 | 待决定 |
| `createViolation` | 创建违规 | 待确认 | 待决定 |
| `deleteViolation` | 删除违规 | 待确认 | 待决定 |
| `getViolationById` | 根据 ID 获取违规 | 待确认 | 待决定 |
| `getViolationStats` | 获取违规统计 | 待确认 | 待决定 |
| `listViolations` | 违规列表 | 待确认 | 待决定 |
| `updateViolation` | 更新违规 | 待确认 | 待决定 |

### carrier 目录 (2 个)

| Handler | 功能 | 前端是否使用 | 处理方案 |
|---------|------|-------------|---------|
| `claimCarrierOrder` | 认领承运商订单 | 待确认 | 待决定 |
| `confirmOrderAddons` | 确认订单附加服务 | 待确认 | 待决定 |

### tenant 目录 (6 个)

| Handler | 功能 | 前端是否使用 | 处理方案 |
|---------|------|-------------|---------|
| `tenantBatchUploadStopPoints` | 批量上传停靠点 | 待确认 | 待决定 |
| `tenantDeleteMyStopPoint` | 删除我的停靠点 | 待确认 | 待决定 |
| `tenantGetMyStopPoint` | 获取我的停靠点 | 待确认 | 待决定 |
| `tenantListMyStopPoints` | 我的停靠点列表 | 待确认 | 待决定 |
| `tenantUpdateMyStopPoint` | 更新我的停靠点 | 待确认 | 待决定 |
| `tenantUploadStopPoint` | 上传停靠点 | 待确认 | 待决定 |

---

## 前端使用情况（已确认）

已确认前端在使用的 API：
- ✅ `tenant/stop-points` - 租户端停靠点管理（`web/tenant-web/public/stop-points.html`）
- ✅ `admin/commissions/config` - 佣金管理（`web/admin-web/public/commissions.html`）
- ✅ `admin/vehicle-models` - 车型管理（`web/admin-web/public/vehicle-models.html`）

---

## 明日待办

1. [ ] 逐一确认 28 个 handler 的使用情况
2. [ ] 删除前端未使用的 handler
3. [ ] 为前端正在使用的 handler 添加 openapi.yaml 定义
4. [ ] 验证服务启动正常
5. [ ] 测试所有功能正常

---

## 相关提交记录

```
780fb26 fix: 添加 adminGetStopPoint 端点定义
1087e6b fix: 启用 OpenAPI 严格模式
d75231a chore: 将数据库文件添加到版本控制
8616940 chore: 添加测试数据到数据库
4615d03 feat: 添加停靠点草稿箱功能
bd951d3 feat: 添加承运商端停靠点查看详情功能
8e175dc fix: 修复管理员审批停靠点接口
d15ec75 fix: 修复平台端待审批列表不显示数据的问题
47e7bca fix: 修复多端认证和 API 请求问题
```

---

## 远程仓库

**地址:** https://github.com/sunsh80/wuliu-saas.git  
**分支:** master  
**状态:** 已同步
