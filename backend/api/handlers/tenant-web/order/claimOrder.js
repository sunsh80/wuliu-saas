// backend/api/handlers/tenant-web/order/claimOrder.js

const db = require('../../../../db/index.js');

module.exports = async function claimOrder(cxt) {
    console.log("Handler function 'claimOrder' called.");
    const req = cxt.request;
    const orderId = req.params.order_id; // 从 URL 参数中获取订单ID
    // 假设认证中间件已将用户信息附加到 cxt
    // 如果没有中间件，则需要从 token 或其他方式解析用户ID
    // 这里假设 cxt.user 存在
    const userId = cxt.user?.id; 

    console.log("Received request to claim order ID:", orderId, "by user ID:", userId);

    if (!orderId) {
        console.log("Missing order ID in request parameters.");
        return {
            status: 400,
            body: {
                success: false,
                error: 'MISSING_ORDER_ID'
            }
        };
    }

    if (!userId) {
        console.log("User ID not found in context. Authentication might have failed.");
        return {
            status: 401, // Unauthorized
            body: {
                success: false,
                error: 'UNAUTHORIZED'
            }
        };
    }

    try {
        console.log("Starting claim process for order:", orderId);
        
        // 获取数据库实例
        const dbInstance = db.getDb();
        console.log("Database instance obtained.");

        // 1. 查询订单是否存在，以及是否可以被认领
        console.log("Checking if order exists and is available for claiming...");
        const orderToClaim = await dbInstance.get(
            `SELECT id, status, carrier_id FROM orders WHERE id = ?`,
            [orderId]
        );
        console.log("Query result for order lookup:", orderToClaim);

        if (!orderToClaim) {
            console.log("Order with ID", orderId, "not found.");
            return {
                status: 404,
                body: {
                    success: false,
                    error: 'ORDER_NOT_FOUND'
                }
            };
        }

        if (orderToClaim.carrier_id !== null) {
            console.log("Order", orderId, "is already claimed by carrier ID:", orderToClaim.carrier_id);
            return {
                status: 409, // Conflict
                body: {
                    success: false,
                    error: 'ORDER_ALREADY_CLAIMED'
                }
            };
        }

        if (!['pending_claim', 'available'].includes(orderToClaim.status)) {
            console.log("Order", orderId, "has status", orderToClaim.status, "which cannot be claimed.");
            return {
                status: 400, // Bad Request
                body: {
                    success: false,
                    error: 'ORDER_CANNOT_BE_CLAIMED'
                }
            };
        }

        // 2. 更新订单的 carrier_id 和 status
        console.log("Attempting to update order", orderId, "with carrier ID:", userId, "and new status 'claimed'.");
        const updateResult = await dbInstance.run(
            `UPDATE orders SET carrier_id = ?, status = ? WHERE id = ? AND carrier_id IS NULL`, // 再次检查 carrier_id 以防并发问题
            [userId, 'claimed', orderId] // 假设认领后状态变为 'claimed'
        );
        console.log("Update query executed. Result:", updateResult);

        if (updateResult.changes === 0) {
            console.log("No rows were updated. This might indicate a concurrent claim conflict.");
            // 可能是并发认领导致的冲突，订单可能刚刚被其他人认领
            return {
                status: 409, // Conflict
                body: {
                    success: false,
                    error: 'CONCURRENT_CLAIM_CONFLICT'
                }
            };
        }

        // 3. 返回成功响应
        console.log("Order", orderId, "successfully claimed by user", userId);
        return {
            status: 200,
            body: {
                success: true,
                message: 'Order claimed successfully',
                data: { orderId: orderId, newStatus: 'claimed', carrierId: userId }
            }
        };

    } catch (error) {
        console.error('Error in claimOrder:', error);
        console.error('Error stack:', error.stack);

        if (error.message.includes('数据库未初始化')) {
             console.log("Caught DATABASE_NOT_INITIALIZED_ERROR in claimOrder");
             return {
                status: 500,
                body: { success: false, error: 'DATABASE_NOT_INITIALIZED_ERROR' }
             };
        }

        return {
            status: 500,
            body: {
                success: false,
                error: 'INTERNAL_SERVER_ERROR'
            }
        };
    }
};