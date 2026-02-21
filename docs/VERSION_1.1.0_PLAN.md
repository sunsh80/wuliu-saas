# 数孪智运无人物流 SaaS 平台 - 1.1.0 版本新增模块计划

**生成时间**: 2026-02-21  
**项目版本**: 1.1.0  
**文档类型**: 新增模块开发计划（参考网约车/无人物流平台）

---

## 📋 版本概述

1.1.0 版本在 1.0.1 基础上，**新增独立功能模块**，参考滴滴/Uber 网约车平台和无人物流平台的行业最佳实践。

### 与 1.0.1 的区别

| 版本 | 定位 | 特点 |
|------|------|------|
| **1.0.1** | 已有功能深化 | 扩展现有订单、支付、车辆模块 |
| **1.1.0** | 全新模块新增 | 智能调度、安全风控、充电桩、电子围栏等独立模块 |

---

## 🎯 1.1.0 新增模块详细规划

### 一、智能调度中心 🔥🔥🔥

**参考对象**: 滴滴派单系统、Uber 匹配引擎

#### 模块概述

基于 **GeoHash** 和**多维度匹配算法**，实现订单与运力的智能匹配，提升配送效率和司机收益。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 附近车辆查看 | 地图上显示附近可用车辆 | P0 |
| 📱 小程序 | 预计接驾时间 | 显示司机预计到达取货点时间 | P0 |
| 📱 小程序 | 智能推荐上车点 | 推荐最佳取货/卸货位置 | P1 |
| 🖥️ PC 平台 | 智能派单配置 | 配置派单模式（抢单/派单/混合） | P0 |
| 🖥️ PC 平台 | 匹配规则配置 | 配置匹配权重（距离 40%、评分 20%、服务区域 20%、车型 20%） | P0 |
| 🖥️ PC 平台 | 运力热力图 | 实时展示运力分布和供需情况 | P0 |
| 🖥️ PC 平台 | 派单监控 | 实时监控派单成功率、响应时间 | P0 |
| 🖥️ PC 平台 | 顺路单计算 | 计算司机返程顺路订单 | P1 |
| 🚚 PC 承运商 | 自动接单 | 设置条件自动接单（区域、货物类型、价格） | P1 |
| 🚚 PC 承运商 | 派单偏好 | 设置偏好订单类型和区域 | P1 |
| 🚚 PC 承运商 | 顺路单推荐 | 推送返程顺路订单 | P1 |

#### 核心算法

**1. GeoHash 位置编码**
```
将地球划分为网格，每个网格用字符串编码
精度 6 位 ≈ 150 米 × 150 米
精度 7 位 ≈ 38 米 × 38 米
精度 8 位 ≈ 19 米 × 19 米

优势:
- 相邻位置编码相似
- 快速查询附近车辆
- 支持范围搜索
```

**2. 多维度匹配评分**
```javascript
matchScore = 
  distanceScore * 0.4 +      // 距离分（越近越高）
  ratingScore * 0.2 +        // 评分分（越高越好）
  serviceAreaScore * 0.2 +   // 服务区域匹配（是否在服务区内）
  vehicleTypeScore * 0.15 +  // 车型匹配（载重、体积）
  preferenceScore * 0.05     // 偏好匹配（顺路度、货物类型偏好）
```

**3. 顺路度计算**
```
顺路度 = (订单起点到司机终点的距离 + 订单终点到司机终点的距离 - 司机原路径距离) / 订单距离
顺路度 < 0.3 视为高度顺路
顺路度 < 0.5 视为中度顺路
```

#### 数据库设计

```sql
-- 派单记录表
CREATE TABLE dispatch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    carrier_id INTEGER,
    match_score REAL,               -- 匹配分数 0-100
    dispatch_mode TEXT,             -- auto/manual/grab
    status TEXT,                    -- pending/accepted/rejected/timeout
    reject_reason TEXT,             -- 拒绝原因
    timeout_count INTEGER DEFAULT 0, -- 超时次数
    created_at DATETIME,
    responded_at DATETIME
);

-- 承运商偏好表
CREATE TABLE carrier_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrier_id INTEGER UNIQUE,
    preferred_areas TEXT,           -- JSON 偏好区域 [{geohash, radius}]
    preferred_cargo_types TEXT,     -- JSON 偏好货物类型
    preferred_time_slots TEXT,      -- JSON 偏好时段
    auto_accept_enabled INTEGER DEFAULT 0,
    auto_accept_radius_km REAL DEFAULT 10,
    min_order_amount REAL,
    max_daily_orders INTEGER,
    return_home_enabled INTEGER DEFAULT 0,
    home_address TEXT,
    home_lat REAL,
    home_lng REAL,
    updated_at DATETIME
);

-- 运力热力图片段表（按小时聚合）
CREATE TABLE capacity_heatmap (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    geohash TEXT,
    geohash_precision INTEGER DEFAULT 6,
    vehicle_count INTEGER,          -- 可用车辆数
    order_count INTEGER,            -- 订单数
    supply_demand_ratio REAL,       -- 供需比（车辆/订单）
    avg_wait_time REAL,             -- 平均等待时间（秒）
    price_multiplier REAL DEFAULT 1.0, -- 价格倍率
    stat_time DATETIME,             -- 统计时间点
    created_at DATETIME
);

-- 派单配置表
CREATE TABLE dispatch_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_name TEXT,
    dispatch_mode TEXT,             -- grab/auto/mixed
    match_radius_km REAL DEFAULT 5,
    max_dispatch_count INTEGER DEFAULT 5, -- 最多同时派单数
    dispatch_interval_seconds INTEGER DEFAULT 3, -- 派单间隔
    timeout_seconds INTEGER DEFAULT 30, -- 接单超时
    match_weights TEXT,             -- JSON 匹配权重配置
    is_enabled INTEGER DEFAULT 1,
    updated_at DATETIME
);
```

#### 新增 API

```
# 客户端
GET    /api/customer/dispatch/nearest-vehicle     # 获取最近车辆
GET    /api/customer/dispatch/eta                 # 预计接驾时间
GET    /api/customer/dispatch/recommended-pickup  # 推荐取货点

# 管理员
GET    /api/admin/dispatch/config                 # 获取派单配置
PUT    /api/admin/dispatch/config                 # 更新派单配置
GET    /api/admin/dispatch/heatmap                # 运力热力图
GET    /api/admin/dispatch/records                # 派单记录
GET    /api/admin/dispatch/stats                  # 派单统计
POST   /api/admin/dispatch/optimize               # 手动优化派单

# 承运商
GET    /api/carrier/dispatch/preferences          # 获取派单偏好
PUT    /api/carrier/dispatch/preferences          # 更新派单偏好
GET    /api/carrier/dispatch/recommended-orders   # 推荐订单（顺路单）
POST   /api/carrier/dispatch/auto-accept          # 设置自动接单
```

#### 技术实现要点

**1. Redis GEO 实时位置存储**
```javascript
// 司机位置更新
await redis.geoAdd('driver_locations', longitude, latitude, driverId);

// 查询附近司机
const nearbyDrivers = await redis.geoSearch('driver_locations', {
  longitude: orderLng,
  latitude: orderLat,
  radius: 5,  // 5 公里
  unit: 'km'
});

// 获取司机位置详情
const driverInfo = await redis.json.get(`driver:${driverId}`);
```

**2. 匹配引擎**
```javascript
async function matchOrderToCarriers(order) {
  // 1. 获取附近司机（GeoHash 范围查询）
  const nearbyCarriers = await getNearbyCarriers(
    order.pickup_lat, 
    order.pickup_lng, 
    radius = 5
  );
  
  // 2. 过滤不符合条件的司机
  const qualifiedCarriers = nearbyCarriers.filter(carrier => 
    carrier.status === 'idle' &&
    carrier.vehicle_type === order.required_vehicle_type &&
    carrier.service_areas.includes(order.area_id) &&
    !carrier.blacklist.includes(order.customer_id)
  );
  
  // 3. 计算匹配分数
  const scoredCarriers = qualifiedCarriers.map(carrier => ({
    ...carrier,
    score: calculateMatchScore(order, carrier)
  }));
  
  // 4. 排序并返回 Top N
  return scoredCarriers
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

---

### 二、安全风控中心 🔥🔥

**参考对象**: 滴滴安全中心、Uber Safety Toolkit

#### 模块概述

提供行程中安全监控、紧急求助、黑名单管理、风险控制等功能，保障配送安全。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 紧急联系人 | 设置紧急联系人，自动通知 | P0 |
| 📱 小程序 | 一键报警 | 紧急情况快速报警（110） | P0 |
| 📱 小程序 | 行程分享 | 分享配送轨迹给亲友 | P0 |
| 📱 小程序 | 安全中心 | 安全知识、紧急求助入口 | P0 |
| 📱 小程序 | 偏航预警 | 配送路线严重偏离时提醒 | P1 |
| 📱 小程序 | 保险购买 | 购买货物运输保险 | P1 |
| 🖥️ PC 平台 | 安全监控大屏 | 实时监控所有在途订单安全状态 | P0 |
| 🖥️ PC 平台 | 异常事件处理 | 处理紧急报警、偏航、长时间停留 | P0 |
| 🖥️ PC 平台 | 黑名单管理 | 恶意用户、违规司机黑名单 | P0 |
| 🖥️ PC 平台 | 风控规则配置 | 配置风险识别规则 | P0 |
| 🖥️ PC 平台 | 保险理赔 | 保险购买记录、理赔处理 | P1 |
| 🖥️ PC 平台 | 安全培训 | 司机安全培训记录和考核 | P1 |
| 🚚 PC 承运商 | 安全培训 | 参加安全培训、考试 | P1 |
| 🚚 PC 承运商 | 事故上报 | 上报配送事故 | P0 |
| 🚚 PC 承运商 | 保险理赔申请 | 提交保险理赔申请 | P1 |

#### 数据库设计

```sql
-- 安全事件表
CREATE TABLE safety_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,                -- emergency/deviation/long_stop/collision/complaint
    order_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    description TEXT,
    location_lat REAL,
    location_lng REAL,
    evidence TEXT,                  -- JSON 证据（图片、录音、轨迹）
    status TEXT DEFAULT 'pending',  -- pending/processing/resolved/closed
    priority TEXT DEFAULT 'normal', -- low/normal/high/critical
    handled_by INTEGER,
    handle_result TEXT,
    created_at DATETIME,
    resolved_at DATETIME
);

-- 紧急联系人表
CREATE TABLE emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    contact_name TEXT,
    contact_phone TEXT,
    relationship TEXT,              -- family/friend/colleague
    notify_order INTEGER DEFAULT 1, -- 通知顺序
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME
);

-- 黑名单表
CREATE TABLE blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_type TEXT,                 -- customer/carrier
    reason TEXT,
    reason_code TEXT,               -- fraud/violation/complaint/abuse
    evidence TEXT,                  -- JSON 证据
    expire_at DATETIME,             -- NULL 表示永久
    created_by INTEGER,
    created_at DATETIME
);

-- 风控规则表
CREATE TABLE risk_control_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT,
    rule_type TEXT,                 -- deviation/long_stop/frequent_cancel/fraud
    condition TEXT,                 -- JSON 条件配置
    action TEXT,                    -- notify/warn/block/review
    threshold REAL,
    is_enabled INTEGER DEFAULT 1,
    updated_at DATETIME
);

-- 保险订单表
CREATE TABLE insurance_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER,
    insurance_type TEXT,            -- cargo/vehicle/liability
    insurance_company TEXT,
    policy_no TEXT,
    premium REAL,                   -- 保费
    coverage REAL,                  -- 保额
    status TEXT DEFAULT 'active',   -- active/expired/claimed
    claim_amount REAL,
    claim_status TEXT,
    created_at DATETIME
);

-- 安全培训记录表
CREATE TABLE safety_training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrier_id INTEGER,
    training_type TEXT,             -- online/offline
    training_topic TEXT,
    training_content TEXT,          -- JSON 培训内容
    score INTEGER,
    passed INTEGER DEFAULT 0,
    completed_at DATETIME,
    expire_at DATETIME
);

-- 行程分享表
CREATE TABLE trip_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    share_code TEXT UNIQUE,
    recipient_phone TEXT,
    view_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME
);
```

#### 新增 API

```
# 客户端
GET    /api/customer/safety/emergency-contacts      # 紧急联系人
POST   /api/customer/safety/emergency-contact       # 添加紧急联系人
PUT    /api/customer/safety/emergency-contact/:id   # 更新紧急联系人
DELETE /api/customer/safety/emergency-contact/:id   # 删除紧急联系人
POST   /api/customer/safety/alert                   # 一键报警
POST   /api/customer/safety/share-trip              # 分享行程
GET    /api/customer/safety/insurance/products      # 保险产品
POST   /api/customer/safety/insurance/purchase      # 购买保险

# 管理员
GET    /api/admin/safety/events                     # 安全事件列表
GET    /api/admin/safety/event/:id                  # 安全事件详情
PUT    /api/admin/safety/event/:id/handle           # 处理安全事件
GET    /api/admin/safety/blacklist                  # 黑名单列表
POST   /api/admin/safety/blacklist                  # 添加到黑名单
DELETE /api/admin/safety/blacklist/:id              # 移除黑名单
GET    /api/admin/safety/risk-rules                 # 风控规则
PUT    /api/admin/safety/risk-rules                 # 更新风控规则
GET    /api/admin/safety/monitor                    # 安全监控大屏
GET    /api/admin/safety/insurance/claims           # 保险理赔列表

# 承运商
POST   /api/carrier/safety/report-accident          # 事故上报
GET    /api/carrier/safety/training                 # 安全培训
POST   /api/carrier/safety/training/complete        # 完成培训
GET    /api/carrier/safety/insurance/claim          # 保险理赔申请
```

#### 风控规则示例

```javascript
// 偏航检测规则
{
  rule_name: "严重偏航预警",
  rule_type: "deviation",
  condition: {
    deviation_distance: ">500",  // 偏离规划路线超过 500 米
    duration: ">120"             // 持续时间超过 120 秒
  },
  action: "notify",
  threshold: 500,
  is_enabled: 1
}

// 长时间停留检测
{
  rule_name: "异常长时间停留",
  rule_type: "long_stop",
  condition: {
    stop_duration: ">600",       // 停留超过 600 秒
    not_at_delivery_point: true  // 不在卸货点
  },
  action: "warn",
  threshold: 600,
  is_enabled: 1
}

// 频繁取消订单
{
  rule_name: "频繁取消订单",
  rule_type: "frequent_cancel",
  condition: {
    cancel_count: ">5",          // 7 天内取消超过 5 次
    time_window: "7d"
  },
  action: "block",
  threshold: 5,
  is_enabled: 1
}
```

---

### 三、充电桩管理模块 🔥

**参考对象**: 特斯拉充电网络、蔚来换电站

#### 模块概述

为无人车/电动车提供充电桩位置查询、空闲状态监控、充电预约、充电记录管理等功能。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 附近充电桩 | 地图显示附近充电桩 | P0 |
| 📱 小程序 | 充电桩详情 | 查看充电桩功率、空闲状态、价格 | P0 |
| 📱 小程序 | 充电预约 | 预约充电桩时段 | P1 |
| 📱 小程序 | 充电记录 | 查看历史充电记录 | P0 |
| 🖥️ PC 平台 | 充电桩管理 | 添加/编辑/删除充电桩 | P0 |
| 🖥️ PC 平台 | 状态监控 | 实时监控充电桩使用状态 | P0 |
| 🖥️ PC 平台 | 充电定价 | 配置充电服务价格 | P0 |
| 🖥️ PC 平台 | 充电统计 | 充电量、收入统计 | P1 |
| 🚚 PC 承运商 | 充电桩导航 | 导航至充电桩 | P0 |
| 🚚 PC 承运商 | 充电预约 | 预约充电桩 | P1 |
| 🚚 PC 承运商 | 充电记录 | 查看充电记录和费用 | P0 |

#### 数据库设计

```sql
-- 充电桩表
CREATE TABLE charging_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    total_ports INTEGER,
    available_ports INTEGER,
    port_types TEXT,              -- JSON [{type, power_kw, count}]
    power_kw REAL,                -- 总功率
    price_per_kwh REAL,           -- 每度电价格
    service_fee_per_kwh REAL,     -- 服务费
    open_time TEXT,               -- 开放时间 HH:MM
    close_time TEXT,              -- 关闭时间 HH:MM
    amenities TEXT,               -- JSON 配套设施
    status TEXT DEFAULT 'available', -- available/occupied/offline
    images TEXT,                  -- JSON 图片
    created_at DATETIME
);

-- 充电端口表
CREATE TABLE charging_ports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    port_no TEXT,
    port_type TEXT,               -- fast/slow/swapping
    power_kw REAL,
    status TEXT DEFAULT 'available', -- available/occupied/reserved/maintenance
    current_vehicle_id INTEGER,
    created_at DATETIME
);

-- 充电记录表
CREATE TABLE charging_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    station_id INTEGER,
    port_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    energy_kwh REAL,              -- 充电量
    cost REAL,                    -- 电费
    service_fee REAL,             -- 服务费
    total_cost REAL,              -- 总费用
    payment_status TEXT DEFAULT 'pending',
    paid_at DATETIME
);

-- 充电预约表
CREATE TABLE charging_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    station_id INTEGER,
    port_id INTEGER,
    reserved_time DATETIME,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'pending', -- pending/confirmed/completed/cancelled
    created_at DATETIME
);
```

#### 新增 API

```
# 客户端
GET    /api/customer/charging/stations              # 充电桩列表
GET    /api/customer/charging/station/:id           # 充电桩详情
GET    /api/customer/charging/availability          # 空闲状态查询
POST   /api/customer/charging/reserve               # 预约充电
GET    /api/customer/charging/records               # 充电记录

# 管理员
GET    /api/admin/charging/stations                 # 充电桩列表
POST   /api/admin/charging/stations                 # 创建充电桩
PUT    /api/admin/charging/stations/:id             # 更新充电桩
DELETE /api/admin/charging/stations/:id             # 删除充电桩
GET    /api/admin/charging/monitor                  # 状态监控
PUT    /api/admin/charging/pricing                  # 更新定价
GET    /api/admin/charging/statistics               # 充电统计

# 承运商
GET    /api/carrier/charging/navigation             # 充电导航
POST   /api/carrier/charging/reserve                # 预约充电
GET    /api/carrier/charging/records                # 充电记录
GET    /api/carrier/charging/cost-analysis          # 充电成本分析
```

---

### 四、电子围栏模块 🔥

**参考对象**: 共享单车电子围栏、网约车服务区管理

#### 模块概述

通过地理围栏技术，管理服务区域、禁行区域、停车区域等，实现自动化区域管控。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 服务区域提示 | 进入/离开服务区域时提示 | P1 |
| 📱 小程序 | 禁行区域预警 | 接近禁行区域时预警 | P1 |
| 🖥️ PC 平台 | 围栏管理 | 创建/编辑/删除电子围栏 | P0 |
| 🖥️ PC 平台 | 围栏类型 | 服务区域/禁行区域/停车区域/限速区域 | P0 |
| 🖥️ PC 平台 | 触发规则配置 | 配置进入/离开时的触发动作 | P0 |
| 🖥️ PC 平台 | 围栏监控 | 监控车辆进出围栏记录 | P0 |
| 🖥️ PC 平台 | 违规统计 | 禁行区域闯入统计 | P1 |
| 🚚 PC 承运商 | 围栏查看 | 查看各类电子围栏范围 | P0 |
| 🚚 PC 承运商 | 围栏预警 | 进出围栏时收到通知 | P0 |

#### 数据库设计

```sql
-- 电子围栏表
CREATE TABLE geo_fences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_name TEXT,
    fence_type TEXT,                -- service_area/restricted/parking/speed_limit
    polygon_coords TEXT,            -- JSON 多边形坐标 [[lng,lat],...]
    circle_center_lat REAL,         -- 圆形围栏中心纬度
    circle_center_lng REAL,         -- 圆形围栏中心经度
    circle_radius_m REAL,           -- 圆形围栏半径（米）
    trigger_event TEXT,             -- enter/exit/both
    action_type TEXT,               -- notify/alert/restrict/speed_limit
    action_config TEXT,             -- JSON 动作配置
    priority INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    valid_start DATETIME,
    valid_end DATETIME,
    created_at DATETIME
);

-- 围栏触发记录表
CREATE TABLE geo_fence_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    trigger_event TEXT,             -- enter/exit
    trigger_time DATETIME,
    location_lat REAL,
    location_lng REAL,
    action_taken TEXT,              -- 执行的动作
    created_at DATETIME
);

-- 围栏违规记录表
CREATE TABLE geo_fence_violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_id INTEGER,
    vehicle_id INTEGER,
    user_id INTEGER,
    violation_type TEXT,            -- enter_restricted/exit_service_area
    violation_time DATETIME,
    location_lat REAL,
    location_lng REAL,
    penalty_amount REAL,            -- 罚款金额
    penalty_points INTEGER,         -- 扣分
    status TEXT DEFAULT 'pending',  -- pending/paid/appealed
    handled_at DATETIME
);
```

#### 新增 API

```
# 管理员
GET    /api/admin/geo-fences/list                   # 围栏列表
POST   /api/admin/geo-fences/create                 # 创建围栏
PUT    /api/admin/geo-fences/:id                    # 更新围栏
DELETE /api/admin/geo-fences/:id                    # 删除围栏
GET    /api/admin/geo-fences/triggers               # 触发记录
GET    /api/admin/geo-fences/violations             # 违规记录
PUT    /api/admin/geo-fences/violations/:id/handle  # 处理违规

# 承运商
GET    /api/carrier/geo-fences/nearby               # 附近围栏
GET    /api/carrier/geo-fences/violations           # 我的违规
POST   /api/carrier/geo-fences/violations/:id/appeal# 违规申诉
```

---

### 五、维保管理模块 🔥

**参考对象**: 车企维保系统、车队管理系统

#### 模块概述

管理车辆保养计划、维修记录、保险管理等，确保车辆处于良好状态。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 🖥️ PC 平台 | 维保计划管理 | 创建定期保养计划 | P0 |
| 🖥️ PC 平台 | 维保提醒 | 保养到期自动提醒 | P0 |
| 🖥️ PC 平台 | 维修记录 | 记录车辆维修历史 | P0 |
| 🖥️ PC 平台 | 维保成本统计 | 单车维保成本分析 | P1 |
| 🖥️ PC 平台 | 保险管理 | 车辆保险到期提醒 | P0 |
| 🖥️ PC 平台 | 保险理赔 | 保险理赔记录 | P1 |
| 🚚 PC 承运商 | 维保申请 | 申请车辆保养/维修 | P0 |
| 🚚 PC 承运商 | 维保记录 | 查看车辆维保历史 | P0 |
| 🚚 PC 承运商 | 保险查询 | 查看车辆保险信息 | P0 |

#### 数据库设计

```sql
-- 维保计划表
CREATE TABLE maintenance_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT,
    vehicle_type TEXT,
    maintenance_type TEXT,        -- regular/repair
    interval_days INTEGER,        -- 间隔天数
    interval_km INTEGER,          -- 间隔里程
    maintenance_items TEXT,       -- JSON 保养项目
    estimated_cost REAL,
    estimated_duration INTEGER,   -- 预计时长（分钟）
    is_enabled INTEGER DEFAULT 1
);

-- 维保记录表
CREATE TABLE maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    plan_id INTEGER,
    maintenance_type TEXT,        -- regular/repair
    description TEXT,
    maintenance_items TEXT,       -- JSON 实际保养项目
    cost REAL,
    duration_minutes INTEGER,
    service_provider TEXT,        -- 服务商
    technician TEXT,              -- 技师
    before_images TEXT,           -- JSON 维修前图片
    after_images TEXT,            -- JSON 维修后图片
    completed_at DATETIME,
    next_maintenance_at DATETIME
);

-- 车辆保险表
CREATE TABLE vehicle_insurances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    insurance_type TEXT,          -- compulsory/commercial/liability
    insurance_company TEXT,
    policy_no TEXT,
    coverage REAL,
    premium REAL,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'active', -- active/expired
    claim_records TEXT,           -- JSON 理赔记录
    created_at DATETIME
);
```

#### 新增 API

```
# 管理员
GET    /api/admin/maintenance/plans                 # 维保计划列表
POST   /api/admin/maintenance/plans                 # 创建维保计划
PUT    /api/admin/maintenance/plans/:id             # 更新维保计划
GET    /api/admin/maintenance/records               # 维保记录
POST   /api/admin/maintenance/records               # 创建维保记录
GET    /api/admin/maintenance/cost-analysis         # 成本分析
GET    /api/admin/maintenance/insurance/list        # 保险列表
POST   /api/admin/maintenance/insurance             # 添加保险

# 承运商
GET    /api/carrier/maintenance/apply               # 维保申请
POST   /api/carrier/maintenance/apply               # 提交申请
GET    /api/carrier/maintenance/records             # 维保记录
GET    /api/carrier/maintenance/insurance           # 保险信息
```

---

### 六、积分商城模块 🔥

**参考对象**: 滴滴积分商城、航空公司里程计划

#### 模块概述

建立用户积分体系，用户可通过下单、评价、邀请等行为获取积分，积分可兑换优惠券、服务等。

#### 功能规划

| 端口 | 功能 | 说明 | 优先级 |
|------|------|------|--------|
| 📱 小程序 | 积分查询 | 查看当前积分、积分明细 | P0 |
| 📱 小程序 | 积分任务 | 查看可获取积分的任务 | P0 |
| 📱 小程序 | 积分商城 | 浏览可兑换商品/优惠券 | P0 |
| 📱 小程序 | 积分兑换 | 使用积分兑换商品 | P0 |
| 📱 小程序 | 兑换记录 | 查看积分兑换历史 | P0 |
| 🖥️ PC 平台 | 积分规则配置 | 配置积分获取规则 | P0 |
| 🖥️ PC 平台 | 商品管理 | 添加/编辑/下架兑换商品 | P0 |
| 🖥️ PC 平台 | 订单管理 | 处理积分兑换订单 | P0 |
| 🖥️ PC 平台 | 积分统计 | 积分发放、消耗统计 | P1 |

#### 数据库设计

```sql
-- 积分规则表
CREATE TABLE points_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT,
    action_type TEXT,             -- order_complete/review/invite/daily_signin
    points_amount INTEGER,
    daily_limit INTEGER,          -- 每日上限
    description TEXT,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME
);

-- 用户积分表
CREATE TABLE user_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    used_points INTEGER DEFAULT 0,
    expired_points INTEGER DEFAULT 0,
    last_updated DATETIME
);

-- 积分明细表
CREATE TABLE points_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    transaction_type TEXT,        -- earn/use/expire
    points_amount INTEGER,
    balance_after INTEGER,
    source_type TEXT,             -- order/review/invite/exchange
    source_id INTEGER,            -- 关联的订单/评价等 ID
    description TEXT,
    expire_at DATETIME,           -- 积分过期时间
    created_at DATETIME
);

-- 积分商品表
CREATE TABLE points_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    product_type TEXT,            -- coupon/service/gift
    points_price INTEGER,
    cash_price REAL,              -- 现金 + 积分混合支付时的现金部分
    stock INTEGER,
    description TEXT,
    images TEXT,                  -- JSON 图片
    exchange_limit INTEGER,       -- 每人限兑
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'active', -- active/sold_out/offline
    created_at DATETIME
);

-- 积分兑换订单表
CREATE TABLE points_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    points_used INTEGER,
    cash_paid REAL,
    status TEXT DEFAULT 'pending', -- pending/processing/shipped/completed
    shipping_address TEXT,
    tracking_no TEXT,
    created_at DATETIME,
    shipped_at DATETIME,
    completed_at DATETIME
);
```

#### 新增 API

```
# 客户端
GET    /api/customer/points/balance                 # 积分余额
GET    /api/customer/points/transactions            # 积分明细
GET    /api/customer/points/tasks                   # 积分任务
POST   /api/customer/points/tasks/complete          # 完成任务
GET    /api/customer/points/products                # 积分商品
POST   /api/customer/points/exchange                # 积分兑换
GET    /api/customer/points/orders                  # 兑换订单

# 管理员
GET    /api/admin/points/rules                      # 积分规则
PUT    /api/admin/points/rules                      # 更新积分规则
GET    /api/admin/points/products                   # 商品列表
POST   /api/admin/points/products                   # 创建商品
PUT    /api/admin/points/products/:id               # 更新商品
GET    /api/admin/points/orders                     # 兑换订单
PUT    /api/admin/points/orders/:id/ship            # 发货
GET    /api/admin/points/statistics                 # 积分统计
```

---

## 📊 开发优先级与排期

### 第一阶段（3 周）- 核心新增模块

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 智能调度中心 | GeoHash、匹配算法、派单系统 | 8 |
| 安全风控中心 | 紧急求助、黑名单、风控规则 | 5 |
| **小计** | | **13 人天** |

### 第二阶段（2 周）- 运力保障模块

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 充电桩管理 | 充电桩 CRUD、状态监控、充电记录 | 4 |
| 电子围栏 | 围栏管理、触发记录、违规处理 | 3 |
| 维保管理 | 维保计划、维修记录、保险管理 | 3 |
| **小计** | | **10 人天** |

### 第三阶段（2 周）- 用户增长模块

| 模块 | 功能 | 工作量 (人天) |
|------|------|---------------|
| 积分商城 | 积分规则、商品管理、兑换系统 | 5 |
| 优化迭代 | 性能优化、Bug 修复 | 2 |
| **小计** | | **7 人天** |

### 总计

| 指标 | 数值 |
|------|------|
| 总周期 | 7 周 |
| 总工作量 | 30 人天 |
| 新增数据库表 | ~25 张 |
| 新增 API 接口 | ~70 个 |
| 新增前端页面 | ~35 个 |

---

## 🗄️ 1.1.0 新增数据库表汇总

| 模块 | 新增表 |
|------|--------|
| 智能调度 | `dispatch_records`、`carrier_preferences`、`capacity_heatmap`、`dispatch_configs` |
| 安全风控 | `safety_events`、`emergency_contacts`、`blacklist`、`risk_control_rules`、`insurance_orders`、`safety_training_records`、`trip_shares` |
| 充电桩管理 | `charging_stations`、`charging_ports`、`charging_records`、`charging_reservations` |
| 电子围栏 | `geo_fences`、`geo_fence_triggers`、`geo_fence_violations` |
| 维保管理 | `maintenance_plans`、`maintenance_records`、`vehicle_insurances` |
| 积分商城 | `points_rules`、`user_points`、`points_transactions`、`points_products`、`points_orders` |

---

## 📦 1.1.0 后端 API 文件结构

```
backend/api/handlers/
│
├── 📂 dispatch/                      # 智能调度
│   ├── getNearestVehicle.js
│   ├── getETA.js
│   ├── getRecommendedPickup.js
│   ├── matchOrderToCarriers.js
│   └── ...
│
├── 📂 admin/dispatch/
│   ├── getConfig.js
│   ├── updateConfig.js
│   ├── getHeatmap.js
│   ├── getRecords.js
│   └── ...
│
├── 📂 carrier/dispatch/
│   ├── getPreferences.js
│   ├── updatePreferences.js
│   ├── getRecommendedOrders.js
│   └── ...
│
├── 📂 customer/safety/               # 安全风控
│   ├── getEmergencyContacts.js
│   ├── addEmergencyContact.js
│   ├── sendAlert.js
│   ├── shareTrip.js
│   └── ...
│
├── 📂 admin/safety/
│   ├── getEvents.js
│   ├── handleEvent.js
│   ├── getBlacklist.js
│   ├── addToBlacklist.js
│   └── ...
│
├── 📂 customer/charging/             # 充电桩
│   ├── getStations.js
│   ├── getStationDetail.js
│   ├── reserveCharging.js
│   └── ...
│
├── 📂 admin/geo-fences/              # 电子围栏
│   ├── listFences.js
│   ├── createFence.js
│   ├── getTriggers.js
│   └── ...
│
├── 📂 admin/maintenance/             # 维保管理
│   ├── getPlans.js
│   ├── createPlan.js
│   ├── getRecords.js
│   └── ...
│
└── 📂 customer/points/               # 积分商城
    ├── getBalance.js
    ├── getTasks.js
    ├── getProducts.js
    ├── exchangeProduct.js
    └── ...
```

---

## ✅ 验收标准

### 智能调度

- [ ] 支持 GeoHash 精度 6-8 位可配置
- [ ] 匹配算法支持多维度权重配置
- [ ] 派单响应时间 < 3 秒
- [ ] 支持抢单/派单/混合三种模式
- [ ] 运力热力图更新频率 < 1 分钟

### 安全风控

- [ ] 一键报警响应时间 < 1 秒
- [ ] 偏航检测准确率 > 95%
- [ ] 黑名单支持永久和临时两种
- [ ] 风控规则支持动态配置
- [ ] 行程分享支持微信、短信分享

### 充电桩管理

- [ ] 支持快充/慢充/换电多种类型
- [ ] 充电桩状态实时更新
- [ ] 支持充电预约功能
- [ ] 充电记录支持费用统计

### 电子围栏

- [ ] 支持多边形和圆形两种围栏
- [ ] 围栏触发延迟 < 5 秒
- [ ] 支持进入/离开/双向触发
- [ ] 违规记录支持申诉流程

### 维保管理

- [ ] 维保计划支持按天数和里程
- [ ] 保险到期提前 30 天提醒
- [ ] 维保记录支持图片上传

### 积分商城

- [ ] 积分规则支持动态配置
- [ ] 积分获取实时到账
- [ ] 积分兑换支持库存管理
- [ ] 兑换订单支持物流跟踪

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| 1.1.0 | 2026-02-21 | 初始版本，规划 6 大新增模块 | - |

---

**文档版本**: 1.1.0  
**最后更新**: 2026-02-21  
**状态**: 待评审
