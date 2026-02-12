// backend/api/handlers/wallet/getCurrentUserWallet.js
const { getDb } = require('../../../db/index.js');

module.exports = async (c) => {
  const userId = c.context?.id;
  const tenantId = c.context?.tenantId;

  if (!userId || !tenantId) {
    return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } };
  }

  const db = getDb();

  try {
    // 根据用户角色确定钱包类型
    let ownerType = 'customer'; // 默认为客户
    if (c.context.roles && c.context.roles.includes('carrier')) {
      ownerType = 'carrier';
    } else if (c.context.roles && c.context.roles.includes('admin')) {
      ownerType = 'platform';
    }

    // 确保钱包存在，如果不存在则创建
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status, currency)
      VALUES (?, ?, 0.0, 0.0, 'active', 'CNY')
    `, [ownerType, tenantId]);

    const wallet = await db.get(
      `SELECT * FROM wallets WHERE owner_type = ? AND owner_id = ?`,
      [ownerType, tenantId]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: { wallet }
      }
    };

  } catch (error) {
    console.error('Get wallet error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};