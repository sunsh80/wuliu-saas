// backend/api/handlers/carrier/quote/submitCarrierQuote.js
 //* 处理 POST /api/carrier/orders/{order_id}/quote 接口。
 //* 允许承运商为他们已认领的订单提交报价。
 //* 报价详情将存储在 'quotes' 表中，并将订单的总状态更新为 'quoted'。
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    console.log("--- 提交承运商报价处理器启动 ---");

    // 1. 认证与授权检查
    const userId = c.context?.id;
    const userRoles = c.context?.roles;

    console.log("正在为承运商 ID 处理报价提交:", userId);
    console.log("承运商角色:", userRoles);

    if (!userId) {
        console.warn("❌ 未授权: 在请求上下文中找不到用户 ID。");
        return { status: 401, body: { success: false, error: 'UNAUTHORIZED', message: '需要身份验证。' } };
    }

    if (!userRoles || !userRoles.includes('carrier')) {
        console.warn("❌ 禁止访问: 用户不具有 'carrier' 角色。");
        return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '访问被拒绝。只有承运商才能提交报价。' } };
    }

    // 2. 提取路径参数和请求体
    // 由于 c.request.openapi.params 可能不可靠，使用 Express 原生的 req.params
    const req = c.request; // 获取底层的 Express req 对象
    const orderId = req.params.order_id; // 使用 snake_case 从 req.params 获取
    const { price, deliveryTime, remarks } = req.body; // 从 req.body 获取

    console.log("目标订单 ID (来自 req.params):", orderId); // 使用 snake_case
    console.log("来自请求体的报价详情:", { price, deliveryTime, remarks });

    if (!orderId) {
        console.warn("❌ 错误请求: 'order_id' 在请求路径参数中缺失。");
        return { status: 400, body: { success: false, error: 'MISSING_ORDER_ID', message: "'order_id' 路径参数是必需的。" } };
    }

    // 3. 验证请求体数据
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        console.warn("❌ 错误请求: 请求体中 'price' 无效。", price);
        return { status: 400, body: { success: false, error: 'INVALID_PRICE', message: "'price' 必须是一个正数。" } };
    }
    if (typeof deliveryTime !== 'string' || !deliveryTime.trim()) {
        console.warn("❌ 错误请求: 请求体中 'deliveryTime' 无效或为空。", deliveryTime);
        return { status: 400, body: { success: false, error: 'INVALID_DELIVERY_TIME', message: "'deliveryTime' 是必需的，并且必须是一个有效的字符串。" } };
    }
    if (remarks !== undefined && typeof remarks !== 'string') {
        console.warn("❌ 错误请求: 'remarks' 如果提供则必须是字符串。", remarks);
        return { status: 400, body: { success: false, error: 'INVALID_REMARKS', message: "如果提供，'remarks' 必须是字符串。" } };
    }

    const db = getDb();

    try {
        // 4. 验证订单状态和归属权
        console.log(`🔍 步骤 1: 验证订单 ${orderId} 是否为 'claimed' 状态且归属于承运商 ${userId}。`);
        const orderCheckSql = `
            SELECT id, status, carrier_id
            FROM orders
            WHERE id = ? AND status = 'claimed' AND carrier_id = ?
        `;
        const order = await db.get(orderCheckSql, [orderId, userId]);

        if (!order) {
            console.log("❌ 订单未找到，未处于 'claimed' 状态，或未分配给请求的承运商。");
            return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_CLAIMED_BY_USER', message: "订单未找到，未处于 'claimed' 状态，或非您认领。" } };
        }

        console.log("✅ 订单验证成功。正在继续提交报价。");

        // 5. 将报价提交到 'quotes' 表
        console.log(`🔍 步骤 2: 将订单 ${orderId} 的报价插入到 'quotes' 表，由承运商 ${userId} 提交。`);
        const insertQuoteSql = `
            INSERT INTO quotes (order_id, carrier_id, quote_price, quote_delivery_time, quote_remarks)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.run(insertQuoteSql, [orderId, userId, price, deliveryTime, remarks || null]);

        console.log("✅ 报价已成功插入 'quotes' 表。");

        // 6. 更新订单状态
        console.log(`🔍 步骤 3: 将订单 ${orderId} 的状态更新为 'quoted'。`);
        const updateOrderStatusSql = `
            UPDATE orders
            SET status = 'quoted', updated_at = datetime('now')
            WHERE id = ? AND status = 'claimed'
        `;
        const updateStatusResult = await db.run(updateOrderStatusSql, [orderId]);

        if (updateStatusResult.changes === 0) {
            console.error("💥 严重错误: 更新订单状态失败。订单可能在验证后被并发修改。");
            return { status: 409, body: { success: false, error: 'CONCURRENT_MODIFICATION_ERROR', message: "由于并发修改，更新订单状态失败。请重试。" } };
        }

        console.log("✅ 订单状态已成功更新为 'quoted'。");

        // 7. 准备并发送成功响应
        console.log("🎉 订单", orderId, "的报价提交流程成功完成。");
        return {
            status: 201,
            body: {
                success: true,
                message: '报价提交成功。',
                data: {
                    order_id: parseInt(orderId, 10),
                    quote: {
                        price: price,
                        deliveryTime: deliveryTime,
                        remarks: remarks || null,
                    },
                    carrierId: userId,
                }
            }
        };

    } catch (error) {
        console.error('💥 [提交承运商报价处理器错误]:', error);

        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.toLowerCase().includes('unique constraint failed')) {
            console.log("⚠️ 冲突: 承运商已为此订单提交过报价 (由于 UNIQUE 约束)。");
            return { status: 409, body: { success: false, error: 'DUPLICATE_QUOTE_ERROR', message: "您已经为此订单提交过报价了。" } };
        }
        if (error.code === 'SQLITE_BUSY' || error.message.includes('database is locked')) {
            console.log("⚠️ 数据库暂时锁定。");
            return { status: 423, body: { success: false, error: 'DATABASE_LOCKED', message: '数据库当前繁忙。请稍后再试。' } };
        }

        console.error("提交报价时发生意外的内部错误。");
        return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误。' } };
    }
};