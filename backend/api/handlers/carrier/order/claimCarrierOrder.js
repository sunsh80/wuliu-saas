// backend/api/handlers/carrier/order/claimCarrierOrder.js
const { getDb } = require('../../../../db/index.js');

// 🛡️ 安全执行数据库操作：带超时 + 重试兜底
async function safeDbOperation(operationFn, timeoutMs = 6000, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const error = new Error('DATABASE_OPERATION_TIMEOUT');
          error.code = 'DB_TIMEOUT';
          reject(error);
        }, timeoutMs);

        operationFn()
          .then(result => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch(err => {
            clearTimeout(timeout);
            reject(err);
          });
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        console.log(`🔁 [RETRY ${attempt + 1}/${maxRetries}] Database operation failed, retrying...`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  throw lastError;
}

module.exports = async (c) => {
  console.log("--- Claim Order Handler Start ---");
  console.log("Handler function 'claimCarrierOrder' called.");
  const userId = c.context?.id;
  console.log("Received request to claim order for user ID:", userId);

  if (!userId) {
    console.warn("⚠️ Unauthorized: No user ID in context");
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  let dbConnection;
  try {
    dbConnection = await getDb();
    console.log("Database connection acquired.");

    const orderId = c.request.params.order_id;
    if (!orderId) {
      console.warn("⚠️ Missing order_id in path parameters");
      return { status: 400, body: { success: false, error: 'MISSING_ORDER_ID' } };
    }

    // 🔍 STEP 1: 获取用户信息（含 tenant_id）
    console.log(`🔍 [STEP 1] Fetching tenant_id from users table for user ID: ${userId}`);
    const userRecord = await safeDbOperation(() => new Promise((resolve, reject) => {
      dbConnection.get(
        `SELECT tenant_id FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            console.error('❌ Database error during user lookup:', err.message);
            return reject(err);
          }
          resolve(row);
        }
      );
    }));

    console.log("✅ [STEP 1 COMPLETE] User record:", userRecord);

 // 直接使用上下文中的 tenantId 和 roles
if (!c.context.roles.includes('carrier')) {
  return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
}
const userTenantId = c.context.tenantId;

    // 🔍 STEP 2: 获取订单信息（校验 tenant_id 匹配）
    console.log(`🔍 [STEP 2] Fetching order ID ${orderId} for tenant ID ${userTenantId}`);
    const order = await safeDbOperation(() => new Promise((resolve, reject) => {
      dbConnection.get(
        `SELECT id, status, carrier_id, tenant_id FROM orders WHERE id = ? AND tenant_id = ?`,
        [orderId, userTenantId],
        (err, row) => {
          if (err) {
            console.error('❌ Database error during order lookup:', err.message);
            return reject(err);
          }
          resolve(row);
        }
      );
    }));

    console.log("✅ [STEP 2 COMPLETE] Order record:", order);

    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
    }

    if (order.status !== 'pending_claim') {
      return { status: 400, body: { success: false, error: 'ORDER_NOT_PENDING' } };
    }

    if (order.carrier_id && order.carrier_id !== userId) {
      return { status: 403, body: { success: false, error: 'ORDER_ALREADY_CLAIMED_BY_OTHER' } };
    }

    // 🔍 STEP 3: 更新订单为已认领
    console.log(`🔍 [STEP 3] Updating order ${orderId} to claimed by user ${userId}`);
    const updateResult = await safeDbOperation(() => new Promise((resolve, reject) => {
      dbConnection.run(
        `UPDATE orders SET carrier_id = ?, status = 'claimed', updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
        [userId, orderId, userTenantId],
        function(err) {
          if (err) {
            console.error('❌ Database error during order update:', err.message);
            return reject(err);
          }
          resolve(this);
        }
      );
    }));

    console.log("✅ [STEP 3 COMPLETE] Update result:", updateResult);

    if (updateResult.changes === 0) {
      return { status: 409, body: { success: false, error: 'CONCURRENT_UPDATE_NO_ROWS_AFFECTED' } };
    }

    console.log("🎉 Order claimed successfully!");
    return {
      status: 200,
      body: {
        success: true,
        message: 'Order claimed successfully',
        data: { orderId, userId, status: 'claimed' }
      }
    };

  } catch (error) {
    console.error('💥 [HANDLER ERROR]:', error.message);
    if (error.code === 'DB_TIMEOUT') {
      return {
        status: 500,
        body: {
          success: false,
          error: 'DATABASE_TIMEOUT',
          message: 'Database is busy, please try again.'
        }
      };
    }
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    };
  }
};