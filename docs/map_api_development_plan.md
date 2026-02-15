# 地图服务API开发计划

## 当前状态
- 基准文件: `backend/openapi.yaml` (已整合地图服务API)
- 回滚锚点: `backend/openapi.yaml.before-map-dev`
- 开发开始时间: 2026年2月15日

## 开发目标
基于已整合的OpenAPI规范，实现以下功能：

### 1. 地图服务API实现
- [ ] 地理编码服务 (`/api/map/geocode`)
- [ ] 逆地理编码服务 (`/api/map/reverse-geocode`)
- [ ] 路径规划服务 (`/api/map/route`)
- [ ] 距离计算服务 (`/api/map/distance`)
- [ ] POI搜索服务 (`/api/map/poi`)
- [ ] 停靠点管理服务 (`/api/map/stop-points`)

### 2. 无人车路径规划服务实现
- [ ] 无人车路径规划 (`/api/av-route/calculate`)
- [ ] 多点路径规划 (`/api/av-route/multi-point`)
- [ ] 路径详情查询 (`/api/av-route/details/{routeId}`)
- [ ] 实时路径调整 (`/api/av-route/adjust`)

### 3. 车辆位置回传服务实现
- [ ] 车辆位置更新回调 (`/api/tracking/position-update`)
- [ ] 车辆当前位置查询 (`/api/tracking/current-position/{vehicleId}`)
- [ ] 车辆历史轨迹查询 (`/api/tracking/history/{vehicleId}`)
- [ ] 车辆在线状态查询 (`/api/tracking/online-status/{vehicleId}`)

## 实现步骤
1. 创建服务抽象层
2. 实现具体服务商（腾讯地图、百度地图等）
3. 实现API控制器
4. 集成到现有业务流程
5. 编写单元测试
6. 进行集成测试

## 注意事项
- 保持与现有系统的兼容性
- 确保API安全性
- 实现适当的错误处理和日志记录
- 考虑性能优化和缓存策略

## 回滚方案
如需回滚到开发前状态，执行：
```bash
cp backend/openapi.yaml.before-map-dev backend/openapi.yaml
```