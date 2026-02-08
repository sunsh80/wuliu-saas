以下是一套**完整、可直接复制使用**的无人车货运平台报价体系与业务流程方案，涵盖：平台规则、承运商配价、客户下单、附加费用、智能建议、数据模型及关键流程。可直接交付开发团队（如 Qwen）生成代码。

---

# 🚚 无人车货运平台 — 完整报价体系与业务流程（V1.0）

---

## 一、核心定价模型

### 1. 平台基础定价规则（由平台总后台配置）

```json
{
  "city_id": "SH",
  "weekday_type": "workday",

  // 基础费用
  "base_min_price_normal": 8.00,
  "base_min_price_cold": 12.00,
  "mileage_rate": 2.00,          // ¥/km
  "duration_rate": 0.30,         // ¥/min
  "cold_surcharge_fixed": 5.00,  // 冷藏固定附加费

  // 时间段规则（96个15分钟槽）
  "time_slots": {
    "00:00": { "type": "offpeak", "multiplier": 0.8 },
    "00:15": { "type": "offpeak", "multiplier": 0.8 },
    ...
    "07:00": { "type": "peak", "multiplier": 1.3 },
    "07:15": { "type": "peak", "multiplier": 1.3 },
    ...
    "12:00": { "type": "normal", "multiplier": 1.0 }
  },

  // 承运商浮动边界
  "carrier_adjust_bounds": {
    "global": [-0.15, 0.20],
    "mileage": [-0.10, 0.10]
  },

  // 附加服务定义（平台级）
  "add_ons": {
    "loading_unloading": { "enabled": true, "price": 15.00, "description": "装卸服务" },
    "waiting_fee": { "enabled": true, "price": 5.00, "per_unit": "5min", "description": "超时等待费（>10分钟）" },
    "special_handling": { "enabled": false, "price": 20.00, "description": "特殊货物处理" }
  }
}
```

---

### 2. 承运商配价策略（由承运商后台配置）

```json
{
  "carrier_id": 1001,

  // 时间定价模式（当前仅简化模式生效）
  "use_advanced_time_pricing": false,
  "time_pricing_simple": {
    "peak": 0.05,
    "normal": 0.00,
    "offpeak": -0.10
  },
  "time_pricing_advanced": {}, // 预留

  // 冷藏额外收费
  "cold_extra_fee": 0.00,

  // 天气接单策略
  "accept_rain_orders": true,
  "accept_snow_orders": false,

  // 附加服务策略（承运商自定义）
  "add_ons": {
    "loading_unloading": { "enabled": true, "price": 18.00 },
    "waiting_fee": { "enabled": false, "price": null },
    "special_handling": { "enabled": true, "price": 25.00 }
  }
}
```

---

## 二、端到端业务流程

### 步骤 1：客户下单（初始请求）
- 输入：起点、终点、车型（常温/冷藏）、期望取件时间。
- 默认：**无任何附加服务**。
- 系统自动获取：距离、预估时长、天气、路线。

### 步骤 2：平台计算基础报价（BasePrice）
```js
basePrice = max(
  isCold ? base_min_price_cold : base_min_price_normal,
  mileage_rate * distance + duration_rate * duration + (isCold ? cold_surcharge_fixed : 0)
);
```

### 步骤 3：匹配时间槽 & 动态系数
- 根据 `pickupTime` → 匹配 `time_slots["HH:mm"]` → 获取 `type` 和 `multiplier`。
- 获取天气系数（晴=1.0，雨=1.2，雪=1.5）。

### 步骤 4：为每个承运商计算最终竞价价格（FinalPrice）
```js
// 仅用于排序和展示的价格（不含附加费！）
finalPrice = basePrice 
           * timeSlot.multiplier 
           * weatherMultiplier 
           * (1 + carrier.time_pricing_simple[timeSlot.type])
           + (isCold ? carrier.cold_extra_fee : 0);
```

### 步骤 5：客户查看报价列表
| 承运商 | 车型 | 预计到达 | 报价（基础运费） |
|--------|------|----------|------------------|
| 快运A | 冷藏 | 25 min | ¥32.50 |
| 京东无人 | 常温 | 30 min | ¥26.00 |

> ⚠️ **不显示附加费**，所有排序按此价格进行。

### 步骤 6：承运商接单后协商附加费
- 承运商在订单页点击 **“添加附加费”**。
- 弹窗展示其启用的附加服务：
  - [✓] 装卸服务 ¥18.00
  - [ ] 特殊处理 ¥25.00
- 提交后，客户收到确认请求。

### 步骤 7：客户确认附加费
- 同意 → 附加费写入订单，不可更改。
- 拒绝 → 承运商可取消订单或继续无附加运输。

### 步骤 8：结算
| 项目 | 金额 | 说明 |
|------|------|------|
| 基础运费 | ¥26.00 | 平台抽佣（如10%） |
| 装卸服务 | ¥18.00 | 全额归承运商 |
| **总计** | **¥44.00** | 客户实付 |

---

## 三、管理后台功能清单

### A. 平台总后台 (`/admin/pricing`)
- ✅ 基础定价配置（起步价、里程、时长、冷藏）
- ✅ 15分钟粒度时间规则（支持批量设置）
- ✅ 承运商浮动边界设置
- ✅ 附加服务类型管理（启用/禁用、默认价格）

### B. 承运商配价后台 (`/carrier/pricing`)
- ✅ 简化时间定价（高峰/平峰/低谷三滑块）
- ✅ 冷藏额外收费输入框
- ✅ 天气接单开关（雨/雪）
- ✅ 附加服务配置（勾选启用 + 自定义价格）
- ✅ 智能建议面板（“推荐：+3%”，带“一键采纳”）

---

## 四、关键 API 接口

| 接口 | 方法 | 请求/响应示例 |
|------|------|----------------|
| `GET /api/platform/pricing/rule?city=SH&date=2026-02-08` | GET | 返回平台定价规则 |
| `GET /api/carrier/pricing/config` | GET | 返回承运商当前配价 |
| `PUT /api/carrier/pricing/config` | PUT | 更新承运商配价（简化模式） |
| `GET /api/carrier/pricing/suggestions` | GET | 返回智能建议（近30天市场数据） |
| `POST /api/order/quote` | POST | 客户下单，返回多家基础报价 |
| `POST /api/order/{id}/add-ons` | POST | 承运商提交附加费 |
| `PATCH /api/order/{id}/add-ons/confirm` | PATCH | 客户确认附加费 |

---

## 五、数据库表结构（MySQL）

```sql
-- 平台定价规则
CREATE TABLE platform_pricing_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  city_id VARCHAR(10) NOT NULL,
  weekday_type ENUM('workday','weekend','holiday') NOT NULL,
  base_min_price_normal DECIMAL(10,2) NOT NULL,
  base_min_price_cold DECIMAL(10,2) NOT NULL,
  mileage_rate DECIMAL(10,2) NOT NULL,
  duration_rate DECIMAL(10,2) NOT NULL,
  cold_surcharge_fixed DECIMAL(10,2) NOT NULL,
  time_slots JSON NOT NULL,        -- 96个时间段
  carrier_adjust_bounds JSON NOT NULL,
  add_ons JSON NOT NULL,           -- 附加服务定义
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_city_weekday (city_id, weekday_type)
);

-- 承运商配价配置
CREATE TABLE carrier_pricing_configs (
  carrier_id BIGINT PRIMARY KEY,
  use_advanced_time_pricing BOOLEAN DEFAULT FALSE,
  time_pricing_simple JSON NOT NULL,     -- {"peak":0.05,...}
  time_pricing_advanced JSON NOT NULL,   -- {}
  cold_extra_fee DECIMAL(10,2) DEFAULT 0.00,
  accept_rain_orders BOOLEAN DEFAULT TRUE,
  accept_snow_orders BOOLEAN DEFAULT TRUE,
  add_ons JSON NOT NULL,                 -- 承运商附加服务策略
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单表（含附加费）
CREATE TABLE orders (
  order_id VARCHAR(32) PRIMARY KEY,
  base_price DECIMAL(10,2) NOT NULL,     -- 用于竞价
  add_ons JSON,                          -- [{"type":"loading_unloading","price":18,"confirmed":true}]
  total_price DECIMAL(10,2) AS (base_price + COALESCE(JSON_EXTRACT(add_ons, '$[*].price'), 0)) STORED,
  ...
);
```

---

## 六、智能定价建议（运营赋能）

- **数据源**：近30天同城市、同时段成交订单均价。
- **建议逻辑**：
  ```js
  suggested_pct = (market_avg_price / platform_base_price) - 1;
  ```
- **前端展示**：
  > 💡 **智能建议**：高峰时段推荐 +3%（当前市场均价 ¥25.2，您的报价偏高 3.2%）  
  > [一键采纳]

---

## 七、总结：设计原则

| 目标 | 实现方式 |
|------|----------|
| ✅ **公平竞价** | 报价仅含基础运费，附加费不参与排序 |
| ✅ **承运商自主** | 可配置时间浮动、附加服务、冷藏溢价 |
| ✅ **客户透明** | 附加费需手动确认，结算分项列明 |
| ✅ **平台可控** | 统一基础规则 + 浮动边界 + 附加服务定义 |
| ✅ **未来可扩展** | 预留15分钟高级定价、分线路建议等能力 |

---

> ✅ **此文档可直接复制给开发团队（如 Qwen）用于生成前后端代码、数据库迁移脚本及 API 文档。**  
> 如需调整默认值、字段名或业务规则，请在此基础上微调。

请确认是否符合您的最终需求。