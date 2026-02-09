// backend/api/handlers/public/getOrderQuote.js
const { getDb } = require('../../../db/index.js');

/**
 * 计算订单报价的核心逻辑
 * @param {Object} orderData - 订单数据
 * @param {Object} pricingRule - 定价规则
 * @returns {Object} 包含报价信息的对象
 */
async function calculateQuoteForRule(orderData, pricingRule) {
  const {
    distance_km = 0,
    duration_hours = 0,
    weight_kg = 0,
    is_cold_storage = false,
    time_slot = null,
    weather_condition = 'normal', // 'normal', 'rain', 'snow', 'storm'
    region = null,
    vehicle_type = null
  } = orderData;

  let calculatedPrice = pricingRule.base_price || 0;
  
  // 根据距离计算费用
  if (distance_km > 0) {
    calculatedPrice += (distance_km * (pricingRule.price_per_km || 0));
  }
  
  // 根据时长计算费用
  if (duration_hours > 0) {
    calculatedPrice += (duration_hours * (pricingRule.price_per_hour || 0));
  }
  
  // 根据重量计算费用
  if (weight_kg > 0) {
    calculatedPrice += (weight_kg * (pricingRule.price_per_kg || 0));
  }
  
  // 冷藏附加费
  if (is_cold_storage && pricingRule.cold_storage_surcharge > 0) {
    calculatedPrice += pricingRule.cold_storage_surcharge;
  }
  
  // 时间段倍率
  if (time_slot && pricingRule.time_slot_rules) {
    try {
      const timeSlotRules = typeof pricingRule.time_slot_rules === 'string' 
        ? JSON.parse(pricingRule.time_slot_rules) 
        : pricingRule.time_slot_rules;
      
      // 查找适用的时间段规则
      if (timeSlotRules && timeSlotRules[time_slot]) {
        const multiplier = timeSlotRules[time_slot].multiplier || 1.0;
        calculatedPrice *= multiplier;
      }
    } catch (e) {
      console.warn('解析时间段规则时出错:', e.message);
    }
  }
  
  // 地区规则
  if (region && pricingRule.region_rules) {
    try {
      const regionRules = typeof pricingRule.region_rules === 'string' 
        ? JSON.parse(pricingRule.region_rules) 
        : pricingRule.region_rules;
      
      if (regionRules && regionRules[region]) {
        const regionMultiplier = regionRules[region].multiplier || 1.0;
        calculatedPrice *= regionMultiplier;
      }
    } catch (e) {
      console.warn('解析地区规则时出错:', e.message);
    }
  }
  
  // 车型规则
  if (vehicle_type && pricingRule.vehicle_type_rules) {
    try {
      const vehicleRules = typeof pricingRule.vehicle_type_rules === 'string' 
        ? JSON.parse(pricingRule.vehicle_type_rules) 
        : pricingRule.vehicle_type_rules;
      
      if (vehicleRules && vehicleRules[vehicle_type]) {
        const vehicleMultiplier = vehicleRules[vehicle_type].multiplier || 1.0;
        calculatedPrice *= vehicleMultiplier;
      }
    } catch (e) {
      console.warn('解析车型规则时出错:', e.message);
    }
  }
  
  // 天气倍率
  if (weather_condition !== 'normal' && pricingRule.weather_multiplier > 1) {
    calculatedPrice *= pricingRule.weather_multiplier;
  }
  
  // 高峰时段倍率
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) { // 早高峰 7-9点，晚高峰 17-19点
    calculatedPrice *= (pricingRule.peak_hour_multiplier || 1.0);
  } else if (hour >= 22 || hour <= 5) { // 夜间 22点-5点
    calculatedPrice *= (pricingRule.off_peak_hour_multiplier || 1.0);
  }
  
  // 确保价格在最小值和最大值范围内
  const minPrice = pricingRule.min_price || 0;
  const maxPrice = pricingRule.max_price || 999999;
  calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice));
  
  return {
    price: parseFloat(calculatedPrice.toFixed(2)),
    base_price: pricingRule.base_price || 0,
    distance_cost: parseFloat((distance_km * (pricingRule.price_per_km || 0)).toFixed(2)),
    duration_cost: parseFloat((duration_hours * (pricingRule.price_per_hour || 0)).toFixed(2)),
    weight_cost: parseFloat((weight_kg * (pricingRule.price_per_kg || 0)).toFixed(2)),
    cold_storage_surcharge: is_cold_storage ? (pricingRule.cold_storage_surcharge || 0) : 0,
    time_slot_multiplier: time_slot ? (timeSlotRules?.[time_slot]?.multiplier || 1.0) : 1.0,
    region_multiplier: region ? (regionRules?.[region]?.multiplier || 1.0) : 1.0,
    vehicle_type_multiplier: vehicle_type ? (vehicleRules?.[vehicle_type]?.multiplier || 1.0) : 1.0,
    weather_multiplier: weather_condition !== 'normal' ? (pricingRule.weather_multiplier || 1.0) : 1.0,
    peak_hour_multiplier: (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) ? (pricingRule.peak_hour_multiplier || 1.0) : 1.0,
    off_peak_multiplier: (hour >= 22 || hour <= 5) ? (pricingRule.off_peak_hour_multiplier || 1.0) : 1.0
  };
}

/**
 * 为订单计算所有可用承运商的报价
 * @param {Object} orderData - 订单数据
 * @returns {Array} 承运商报价列表
 */
async function calculateAllCarrierQuotes(orderData) {
  const db = getDb();
  
  // 获取所有活跃的承运商
  const carriers = await db.all(`
    SELECT t.id as carrier_id, t.name as carrier_name, t.avg_rating
    FROM tenants t
    WHERE t.status = 'approved' AND t.roles LIKE '%carrier%'
  `);
  
  const quotes = [];
  
  for (const carrier of carriers) {
    // 获取该承运商的定价配置
    const carrierPricing = await db.get(`
      SELECT *
      FROM carrier_pricing_configs
      WHERE carrier_tenant_id = ? AND active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `, [carrier.carrier_id]);
    
    if (carrierPricing) {
      // 使用承运商的定价配置计算报价
      const quoteDetails = await calculateQuoteForRule(
        { ...orderData, carrier_id: carrier.carrier_id }, 
        carrierPricing
      );
      
      quotes.push({
        carrier_id: carrier.carrier_id,
        carrier_name: carrier.carrier_name,
        avg_rating: carrier.avg_rating || 0,
        ...quoteDetails
      });
    }
  }
  
  // 按价格排序
  quotes.sort((a, b) => a.price - b.price);
  
  return quotes;
}

module.exports = async (c) => {
  console.log('[getOrderQuote] 开始处理订单报价请求');
  
  try {
    // 从请求体中获取订单信息
    const {
      distance_km,
      duration_hours,
      weight_kg,
      is_cold_storage = false,
      time_slot = null,
      weather_condition = 'normal',
      region = null,
      vehicle_type = null,
      pickup_address = null,
      delivery_address = null,
      cargo_type = null
    } = c.request.body;

    // 驗证必需参数
    if (!distance_km || !duration_hours) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: '距离(distance_km)和时长(duration_hours)是必需的参数'
        }
      };
    }

    // 构建订单数据对象
    const orderData = {
      distance_km: parseFloat(distance_km) || 0,
      duration_hours: parseFloat(duration_hours) || 0,
      weight_kg: parseFloat(weight_kg) || 0,
      is_cold_storage: Boolean(is_cold_storage),
      time_slot,
      weather_condition,
      region,
      vehicle_type,
      pickup_address,
      delivery_address,
      cargo_type
    };

    // 计算所有承运商的报价
    const quotes = await calculateAllCarrierQuotes(orderData);

    console.log(`[getOrderQuote] 为订单计算了 ${quotes.length} 个承运商报价`);

    return {
      status: 200,
      body: {
        success: true,
        message: '报价计算成功',
        data: {
          order_details: orderData,
          quotes: quotes
        }
      }
    };
  } catch (error) {
    console.error('💥 [获取订单报价处理器错误]:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '报价计算失败'
      }
    };
  }
};