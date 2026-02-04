// backend/api/handlers/customer/order/getOrderQuotes.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    console.log("[getOrderQuotes] 开始处理客户订单报价查询");

    // 1. 认证与授权检查
    // 修改：优先从 c.request.session 获取 tenantId
    const userId = c.context?.id || c.request.session?.userId; // 也可以从 session 获取
    const tenantId = c.request.session?.tenantId || c.context?.tenantId; // 优先从 session 获取
    if (!userId || !tenantId) {
        console.warn("❌ 未授权: 在请求上下文或会话中找不到用户 ID 或租户 ID。", { contextId: c.context?.id, sessionId: c.request.session?.userId, contextTenantId: c.context?.tenantId, sessionTenantId: c.request.session?.tenantId });
        return {
            status: 401,
            body: {
                success: false,
                error: 'UNAUTHORIZED',
                message: '需要身份验证。'
            }
        };
    }

    console.log(`[getOrderQuotes] Authenticated - userId: ${userId}, tenantId: ${tenantId}`); // 添加调试日志

    // 2. 提取路径参数
    const req = c.request;
    const orderId = req.params.order_id;
    console.log("[getOrderQuotes] Fetching quotes for order:", orderId);

    if (!orderId) {
        console.warn("❌ 错误请求: 'order_id' 在请求路径参数中缺失。");
        return {
            status: 400,
            body: {
                success: false,
                error: 'MISSING_ORDER_ID',
                message: "'order_id' 路径参数是必需的。"
            }
        };
    }

    const db = getDb();
    try {
        // 3. 验证订单存在性及归属权
        const orderSql = ` 
            SELECT id FROM orders WHERE id = ? AND tenant_id = ? 
        `;
        console.log(`[getOrderQuotes] Executing query with params: [${orderId}, ${tenantId}]`); // 添加调试日志
        const order = await db.get(orderSql, [orderId, tenantId]);
        
        if (!order) {
            console.log("❌ 订单未找到或不属于当前租户。");
            return {
                status: 404,
                body: {
                    success: false,
                    error: 'ORDER_NOT_FOUND',
                    message: "订单未找到或您无权访问此订单。"
                }
            };
        }

        // 4. 从 quotes 表获取该订单的所有报价
        const quotesSql = `
            SELECT q.quote_price AS price, q.quote_delivery_time AS deliveryTime, q.quote_remarks AS remarks,
                   u.id AS carrierId, u.name AS carrierName, u.phone AS carrierPhone
            FROM quotes q
            LEFT JOIN users u ON q.carrier_id = u.id
            WHERE q.order_id = ?
        `;
        const quotes = await db.all(quotesSql, [orderId]);
        console.log("[getOrderQuotes] 从 quotes 表成功获取到", quotes.length, "条报价记录。");

        // 5. 返回成功响应
        return {
            status: 200,
            body: {
                success: true,
                data: {
                    order_id: parseInt(orderId, 10),
                    quotes: quotes.map(q => ({
                        price: q.price,
                        deliveryTime: q.deliveryTime,
                        remarks: q.remarks,
                        carrierId: q.carrierId,
                        carrierName: q.carrierName,
                        carrierPhone: q.carrierPhone
                    }))
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
                message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。'
            }
        };
    }
};