// backend/api/handlers/customer/order/getCustomerOrder.js
// 处理 GET /api/customer/orders/{order_id} 接口。
// 允许客户获取其订单的详细信息。
// 返回的数据结构需与 openapi.yaml 中定义的 schema 一致。
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 获取客户订单详情处理器启动 ---");
  const userId = c.context?.id;
  const userRoles = c.context?.roles;
  const customerTenantId = c.context?.tenantId; // 从 context 获取 tenantId
  console.log("处理订单详情请求，客户 ID:", userId, "租户 ID:", customerTenantId);
  console.log("客户角色:", userRoles);

  if (!userId) {
    console.warn("❌ 未授权: 请求上下文中无用户 ID。");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED', message: '需要身份验证。' } };
  }

  if (!userRoles || !userRoles.includes('customer')) {
    console.warn("❌ 禁止访问: 用户不具有 'customer' 角色。");
    return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '访问被拒绝。只有客户才能查看订单。' } };
  }

  const orderId = c.request.params.order_id; // 修改：使用 order_id
  console.log("请求的订单 ID:", orderId);

  if (!orderId) {
    console.warn("❌ 错误请求: 'order_id' 路径参数缺失。");
    return { status: 400, body: { success: false, error: 'MISSING_ORDER_ID', message: "'order_id' 路径参数是必需的。" } };
  }

  const db = getDb();

  try {
    // --- 查询订单主表 (仅包含 schema.js 中存在的列) ---
    console.log(`🔍 步骤 1: 从 'orders' 表查询订单 ${orderId} 的基本信息。`);
    const orderSql = `
     SELECT o.id,
            o.status,
            o.description,
            o.weight_kg,
            o.volume_m3,
            o.sender_info,
            o.receiver_info,
            o.created_at,
            o.updated_at,
            o.completed_at, -- 添加
            o.quote_price,
            o.quote_delivery_time,
            o.quote_remarks,
            o.quote_deadline,
            o.required_delivery_time,
            o.customer_phone,
            o.tracking_number,
            o.customer_tenant_id,
            o.carrier_id,
            o.tenant_id -- 添加
     FROM orders o
     WHERE o.id = ?
       AND o.customer_tenant_id = ? -- 使用 customer_tenant_id 进行权限校验
    `;
    const order = await db.get(orderSql, [orderId, customerTenantId]);

    if (!order) {
      console.log("❌ 订单未找到或不属于当前客户租户。");
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_ACCESS_DENIED', message: "订单未找到或无权访问。" } };
    }

    // --- 解析发送方和接收方信息 (如果存在) ---
    console.log("🔍 步骤 2: 解析收发货人信息。");
    let senderInfo = {};
    let receiverInfo = {};

    if (order.sender_info) {
      try {
        senderInfo = JSON.parse(order.sender_info);
      } catch (e) {
        console.error("解析 sender_info JSON 失败:", e);
        senderInfo = { name: '未知', phone: '未知' }; // 或其他默认结构
      }
    }

    if (order.receiver_info) {
      try {
        receiverInfo = JSON.parse(order.receiver_info);
      } catch (e) {
        console.error("解析 receiver_info JSON 失败:", e);
        receiverInfo = { name: '未知', phone: '未知' }; // 或其他默认结构
      }
    }

    // --- 查询客户租户信息 ---
    console.log("🔍 步骤 3: 查询客户租户信息。");
    const customerTenantSql = `
     SELECT t.name AS tenant_name
     FROM tenants t
     WHERE t.id = ?
    `;
    const customerTenant = await db.get(customerTenantSql, [order.customer_tenant_id]);
    const customerTenantName = customerTenant ? customerTenant.tenant_name : 'Unknown Customer';

    // --- 查询承运商信息 (如果已分配) ---
    let carrierInfo = null;
    if (order.carrier_id) {
      console.log("🔍 步骤 4: 订单已分配承运商，查询承运商信息。");
      // 注意：carrier_id 在 schema.js 中是 TEXT，但在 schema.js 的 users 表中 id 是 INTEGER。
      // 这里假设 carrier_id 存储的是 users 表的 id (INTEGER)，可能需要转换或调整数据库设计。
      // 如果 carrier_id 存储的是 tenant_id，则需要相应调整 JOIN 条件。
      // 当前假设 carrier_id 对应 users.id (INTEGER)
      const carrierSql = `
       SELECT u.id AS carrier_user_id, u.name AS carrier_name, t.name AS carrier_tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = CAST(? AS INTEGER) -- 将 TEXT 转换为 INTEGER 进行比较
      `;
      carrierInfo = await db.get(carrierSql, [order.carrier_id]);

      if (!carrierInfo) {
        console.warn(`⚠️ 订单 ${orderId} 关联的承运商 ID ${order.carrier_id} 在数据库中未找到。`);
        carrierInfo = { carrier_user_id: order.carrier_id, carrier_name: 'Unknown Carrier', carrier_tenant_name: 'Unknown Tenant' };
      }
    } else {
      console.log("🔍 步骤 4: 订单尚未分配承运商。");
    }

    // --- 构建最终响应对象 (基于 schema.js 存在的列) ---
    // 注意：这里根据实际需要和 openapi.yaml 的定义进行字段映射。
    // 例如，sender_info 和 receiver_info 解析后的内容可以直接放在 sender 和 receiver 对象中。
    const result = {
      id: order.id,
      status: order.status,
      // cargoType: order.cargo_type, // 不存在
      cargoRemark: order.description, // 映射 description
      weightKg: order.weight_kg,
      volumeM3: order.volume_m3,
      // dimensions: { length: order.length, width: order.width, height: order.height, }, // 不存在
      sender: {
        name: senderInfo.name || 'N/A',
        phone: senderInfo.phone || 'N/A',
        // address: order.pickup_address, // 不存在
      },
      receiver: {
        name: receiverInfo.name || 'N/A',
        phone: receiverInfo.phone || 'N/A',
        // address: order.delivery_address, // 不存在
      },
      // vehicleType: order.vehicle_type, // 不存在
      // pickupTime: order.pickup_time, // 不存在
      // awardTime: order.award_time, // 不存在
      // dispatchTime: order.dispatch_time, // 不存在
      deliveryTime: order.completed_at, // 可选：将 completed_at 映射为 deliveryTime
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: {
        tenantId: order.customer_tenant_id,
        tenantName: customerTenantName,
      },
      carrier: carrierInfo ? {
        id: carrierInfo.carrier_user_id,
        name: carrierInfo.carrier_name,
        tenantName: carrierInfo.carrier_tenant_name,
      } : null,
      // 添加其他 schema.js 中存在的字段
      quotePrice: order.quote_price,
      quoteDeliveryTime: order.quote_delivery_time,
      quoteRemarks: order.quote_remarks,
      quoteDeadline: order.quote_deadline,
      requiredDeliveryTime: order.required_delivery_time,
      customerPhone: order.customer_phone,
      trackingNumber: order.tracking_number,
      // carrierTenantId: order.tenant_id, // 可选：如果需要暴露这个
    };

    console.log("✅ 成功获取订单详情。");
    return {
      status: 200,
      body: {
        success: true,
        message: '订单详情获取成功。',
        data: result,
      },
    };

  } catch (error) {
    console.error('💥 [获取客户订单详情处理器错误]:', error);
    if (error.code === 'SQLITE_BUSY' || error.message.includes('database is locked')) {
      console.log("⚠️ 数据库暂时锁定。");
      return { status: 423, body: { success: false, error: 'DATABASE_LOCKED', message: '数据库当前繁忙。请稍后再试。' } };
    }
    console.error("获取订单详情时发生意外的内部错误。");
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' } };
  }
};