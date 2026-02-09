// backend/api/handlers/carrier/pricing/listCarrierPricingConfigs.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  // 检查用户权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('carrier')) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: 'FORBIDDEN',
        message: '只有承运商可以访问此资源'
      }
    };
  }

  const db = getDb();
  
  try {
    // 获取查询参数用于分页
    const page = parseInt(c.request.query.page) || 1;
    const limit = Math.min(parseInt(c.request.query.limit) || 10, 100); // 限制最大每页数量为100
    const offset = (page - 1) * limit;
    
    // 获取承运商ID
    const carrierTenantId = c.context.tenantId;
    
    // 构建查询条件
    let whereClause = "WHERE carrier_tenant_id = ?";
    const params = [carrierTenantId];
    
    // 如果有活动状态参数
    if (c.request.query.active !== undefined) {
      whereClause += " AND active = ?";
      params.push(c.request.query.active === 'true' ? 1 : 0);
    }
    
    // 如果有搜索参数
    if (c.request.query.search) {
      whereClause += " AND config_name LIKE ?";
      params.push(`%${c.request.query.search}%`);
    }

    // 首先获取总数用于分页计算
    const countResult = await db.get(`SELECT COUNT(*) as total FROM carrier_pricing_configs ${whereClause}`, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // 执行分页查询
    const configs = await db.all(`
      SELECT
        id,
        carrier_tenant_id,
        config_name,
        base_price,
        price_per_km,
        price_per_hour,
        price_per_kg,
        cold_storage_surcharge,
        peak_hour_multiplier,
        off_peak_hour_multiplier,
        weather_multiplier,
        min_price,
        max_price,
        time_slot_rules,
        region_rules,
        vehicle_type_rules,
        pricing_strategy,
        service_addons,
        active,
        created_at,
        updated_at
      FROM carrier_pricing_configs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          configs,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            per_page: limit
          }
        }
      }
    };
  } catch (error) {
    console.error('获取承运商定价配置失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取承运商定价配置失败'
      }
    };
  }
};