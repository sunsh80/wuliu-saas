# 数据库配置化改造完成报告

**改造日期**: 2026-02-21  
**改造范围**: 仅数据库逻辑改造

---

## 📋 改造概述

本次改造将硬编码在配置文件和服务层中的配置项迁移到数据库中，实现配置的统一管理和动态调整。

---

## 🗄️ 数据库结构变更

### 新增表

#### 1. system_settings（系统配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| category | TEXT | 配置分类（general, map, route, tracking, payment 等） |
| config_key | TEXT | 配置键（唯一） |
| config_value | TEXT | 配置值（统一存储为文本） |
| config_type | TEXT | 数据类型（string, number, boolean, json） |
| description | TEXT | 配置描述 |
| is_public | BOOLEAN | 是否公开 |
| is_enabled | BOOLEAN | 是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2. service_providers（服务提供商配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| provider_name | TEXT | 提供商名称（TencentMap, BaiduMap, AutoXAVRoute 等） |
| provider_type | TEXT | 服务类型（map, route, tracking） |
| api_endpoint | TEXT | API 端点 |
| api_key | TEXT | API 密钥 |
| auth_token | TEXT | 认证令牌 |
| is_enabled | BOOLEAN | 是否启用 |
| config_json | TEXT | 额外配置（JSON 格式） |
| priority | INTEGER | 优先级（数字越小优先级越高） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 默认配置数据

系统初始化时自动创建以下配置：

**系统配置**:
- `map.defaultProvider` = TencentMap
- `map.geocodeCacheEnabled` = true
- `map.geocodeCacheTTL` = 86400
- `route.defaultProvider` = AutoXAVRoute
- `route.cacheEnabled` = true
- `tracking.defaultProvider` = VehicleCompanyTracking
- `tracking.retentionDays` = 30
- `system.name` = 数孪智运无人物流 SaaS 平台
- `system.version` = 1.0.0

**服务提供商**:
- TencentMap (map): 启用，优先级 1
- BaiduMap (map): 禁用，优先级 2
- AutoXAVRoute (route): 启用，优先级 1
- VehicleCompanyTracking (tracking): 启用，优先级 1

---

## 📦 新增文件

### 数据库模型

| 文件 | 说明 |
|------|------|
| `backend/db/models/ServiceProvider.js` | 服务提供商模型 |
| `backend/db/models/SystemSetting.js` | 系统配置模型（更新） |

### 服务层

| 文件 | 说明 |
|------|------|
| `backend/services/ConfigService.js` | 统一配置服务（新增） |

### 业务服务改造

| 文件 | 改造内容 |
|------|------|
| `backend/services/business/MapService.js` | 从数据库读取地图配置 |
| `backend/services/business/AVRouteService.js` | 从数据库读取路径规划配置 |
| `backend/services/business/TrackingService.js` | 从数据库读取车辆跟踪配置 |

### API Handlers

| 文件 | 说明 |
|------|------|
| `backend/api/handlers/admin/settings/listSystemSettings.js` | 获取系统配置列表 |
| `backend/api/handlers/admin/settings/updateSystemSetting.js` | 更新系统配置 |
| `backend/api/handlers/admin/settings/listServiceProviders.js` | 获取服务提供商列表 |
| `backend/api/handlers/admin/settings/updateServiceProvider.js` | 更新服务提供商配置 |
| `backend/api/handlers/admin/settings/setConfigValue.js` | 快捷设置配置值 |

### 脚本

| 文件 | 说明 |
|------|------|
| `backend/scripts/migrate_config_to_db.js` | 配置迁移脚本 |
| `backend/scripts/test_config_db.js` | 配置功能测试脚本 |
| `backend/scripts/quick_test_config.js` | 快速测试脚本 |

---

## 🧹 清理文件

### 数据库文件（backend/data/）
- `database.db` (0 bytes，空文件)
- `database.sqlite` (0 bytes，空文件)
- `mydatabase.sqbpro` (3512 bytes，SQLite 备份文件)

### 测试脚本（backend/）
- `test_db.js`
- `test_db2.js`
- `check_db_orders.js`

### 迁移脚本（backend/db/migrations/）
- `004_add_vehicle_models_table.js` (与 005 重复)
- `add_addons_to_orders.js` (未使用)

### 冗余文件（backend/）
- `database.js` (已整合到 db/index.js)

---

## 🔧 配置使用方式

### 1. 通过 ConfigService 读取配置

```javascript
const ConfigService = require('../services/ConfigService');

// 获取配置值
const provider = await ConfigService.getConfig('map.defaultProvider', 'TencentMap');

// 获取默认服务提供商
const mapProvider = await ConfigService.getDefaultProvider('map');

// 设置配置值
await ConfigService.setConfig('test.key', 'value', 'string', '描述', 'category');
```

### 2. 服务层自动读取

```javascript
// MapService 自动从数据库读取配置
const { getMapService } = require('../services/business/MapService');
const mapService = await getMapService(); // 异步，从数据库读取

// 或使用同步版本（兼容旧代码）
const mapServiceSync = getMapServiceSync(); // 使用环境变量
```

### 3. API 管理配置

```bash
# 获取系统配置列表
GET /api/admin/settings/system?grouped=true

# 更新系统配置
PUT /api/admin/settings/system/:id
{
  "config_value": "new_value",
  "description": "更新描述",
  "is_enabled": 1
}

# 获取服务提供商列表
GET /api/admin/settings/providers?type=map

# 更新服务提供商配置
PUT /api/admin/settings/providers/:id
{
  "api_key": "your_api_key",
  "is_enabled": 1,
  "priority": 1
}

# 快捷设置配置
POST /api/admin/settings/config/:key
{
  "value": "value",
  "type": "string",
  "description": "描述",
  "category": "category"
}
```

---

## ✅ 测试验证

### 测试结果

```
📋 系统配置:
   map.defaultProvider = TencentMap
   map.geocodeCacheEnabled = true
   map.geocodeCacheTTL = 86400
   route.defaultProvider = AutoXAVRoute
   route.cacheEnabled = true

📋 服务提供商:
   TencentMap (map): https://apis.map.qq.com/ws [启用]
   BaiduMap (map): https://api.map.baidu.com [禁用]
   AutoXAVRoute (route): https://api.autox.com [启用]
   VehicleCompanyTracking (tracking): https://api.vehicle-company.com [启用]
```

### 测试命令

```bash
# 运行完整测试
node backend/scripts/test_config_db.js

# 快速测试
node backend/scripts/quick_test_config.js

# 迁移环境变量配置到数据库
node backend/scripts/migrate_config_to_db.js
```

---

## 📊 改造统计

| 项目 | 数量 |
|------|------|
| 新增数据库表 | 2 |
| 新增数据库模型 | 1 |
| 更新数据库模型 | 1 |
| 新增服务模块 | 1 |
| 改造服务文件 | 3 |
| 新增 API Handlers | 5 |
| 新增脚本 | 3 |
| 清理冗余文件 | 10 |
| 代码变更 | +1594, -399 |

---

## 🔄 迁移步骤

### 从旧配置迁移

1. **备份现有数据库**
   ```bash
   cp backend/data/mydatabase.db backend/data/mydatabase.db.backup
   ```

2. **运行迁移脚本**
   ```bash
   node backend/scripts/migrate_config_to_db.js
   ```

3. **验证配置**
   ```bash
   node backend/scripts/quick_test_config.js
   ```

4. **重启服务**
   ```bash
   npm start
   ```

---

## 📝 注意事项

### 1. 环境变量优先级

配置读取优先级：
1. 数据库配置（优先）
2. 环境变量（兜底）
3. 硬编码默认值（最后）

### 2. 缓存机制

- ConfigService 使用 5 分钟缓存
- 修改配置后自动清除缓存
- 服务层也有 5 分钟缓存

### 3. API 密钥安全

- 敏感配置（api_key, auth_token）存储在数据库中
- `is_public=0` 的配置不会通过公开 API 返回
- 建议生产环境使用环境变量覆盖敏感配置

### 4. 向后兼容

- 保留环境变量支持作为兜底
- 服务层提供同步版本兼容旧代码
- 数据库迁移脚本可重复运行

---

## 🚀 后续优化建议

1. **配置热更新**: 支持 WebSocket 推送配置变更
2. **配置版本管理**: 记录配置变更历史
3. **配置备份恢复**: 定期备份配置到文件
4. **配置校验**: 添加配置值格式校验
5. **配置监控**: 监控配置变更和异常

---

**Git 提交**: `0f3121c`  
**远程仓库**: https://github.com/sunsh80/wuliu-saas/commit/0f3121c
