// backend/api/handlers/tenant-web/order/listPendingOrders.js

const db = require('../../../../db/index.js'); 

module.exports = async function listPendingOrders(cxt) {
    const req = cxt.request;
console.log("DEBUG: listPendingOrders handler started!"); // <--- 添加此行
console.log("DEBUG: Context received:", cxt.request.path, cxt.user); // <--- 添加此行，查看用户信息
    try {
        const limitParam = req.query?.limit;
        const offsetParam = req.query?.offset;
        const limit = parseInt(limitParam) || 10; // 默认值 10
        const offset = parseInt(offsetParam) || 0; // 默认值 0

        // dbModule.getDb() 返回一个包含 get, all, run, close 方法的对象
        const dbInstance = db.getDb(); // 注意：这里使用了 'db' 而不是 'dbModule'
        const orders = await dbInstance.all( // 注意：使用 dbInstance.all
            ` 
            SELECT 
                id, 
                tracking_number AS trackingNumber, -- 映射数据库字段名
                json_extract(sender_info, '$.name') AS senderName, -- 提取 JSON 中的 name
                json_extract(sender_info, '$.phone') AS senderPhone, -- 提取 JSON 中的 phone
                json_extract(receiver_info, '$.address') AS receiverAddress, -- 提取 JSON 中的 address
                json_extract(receiver_info, '$.weight_kg') AS weight_kg, -- 提取 JSON 中的 weight_kg
                json_extract(receiver_info, '$.description') AS description, -- 提取 JSON 中的 description
                status,
                created_at AS createdAt
            FROM orders 
            WHERE 
                status IN ('pending_claim', 'available') -- 可认领状态
                AND carrier_id IS NULL -- 未被任何承运商认领 (使用正确的字段名)
                -- 如果需要按租户的服务范围等过滤，可能需要更复杂的逻辑
            ORDER BY created_at DESC 
            LIMIT ? 
            OFFSET ? 
            `,
            [limit, offset] // 使用安全获取的值
        );

        return { // 返回一个对象
            status: 200, // openapi-backend 会识别这个 status
            body: { // openapi-backend 会识别这个 body
                success: true,
                data: orders
            }
        };

    } catch (error) {
        if (error.message.includes('数据库未初始化')) {
            return {
                status: 500,
                body: { success: false, error: 'DATABASE_NOT_INITIALIZED_ERROR' }
            };
        }

        // 一般的内部错误
        return {
            status: 500,
            body: {
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                // message: error.message // 仅开发时开启，生产环境移除
            }
        };
    }
};