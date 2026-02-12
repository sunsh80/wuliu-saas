// backend/api/handlers/wallet/getWalletTransactions.js
const { getDb } = require('../../../db/index.js');

module.exports = async (c) => {
  const walletId = c.request.params.wallet_id;
  const userId = c.context?.id;
  const tenantId = c.context?.tenantId;

  if (!userId || !tenantId) {
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const db = getDb();

  try {
    // 验证钱包是否属于当前用户
    const wallet = await db.get(
      `SELECT * FROM wallets WHERE id = ?`,
      [walletId]
    );

    if (!wallet) {
      return { status: 404, body: { success: false, error: 'WALLET_NOT_FOUND' } };
    }

    // 检查钱包是否属于当前用户
    if (wallet.owner_id !== tenantId) {
      return { status: 403, body: { success: false, error: 'FORBIDDEN' } };
    }

    // 获取查询参数
    const queryParams = c.request.query;
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
    const transactionType = queryParams.transaction_type || null;
    const startDate = queryParams.start_date || null;
    const endDate = queryParams.end_date || null;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = "WHERE wallet_id = ?";
    const params = [walletId];

    if (transactionType) {
      whereClause += " AND transaction_type = ?";
      params.push(transactionType);
    }

    if (startDate) {
      whereClause += " AND created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND created_at <= ?";
      params.push(endDate);
    }

    // 查询交易记录总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
      params
    );

    const total = countResult.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 查询交易记录
    const transactions = await db.all(`
      SELECT * FROM wallet_transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          transactions,
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
    console.error('Get wallet transactions error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};