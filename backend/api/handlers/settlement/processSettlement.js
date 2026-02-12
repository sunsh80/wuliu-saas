// backend/api/handlers/settlement/processSettlement.js
const { getDb } = require('../../../db/index.js');

module.exports = async (c) => {
  const { order_id } = c.request.params;
  const { force_settle } = c.request.body;

  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    return { status: 403, body: { success: false, error: 'FORBIDDEN' } };
  }

  const db = getDb();

  try {
    // 1. 获取订单信息
    const order = await db.get(`
      SELECT 
        o.id, o.quote_price, o.total_price_with_addons, o.carrier_id, o.customer_tenant_id,
        o.status as order_status,
        u.name as carrier_name, cu.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.carrier_id = u.id
      LEFT JOIN tenants cu ON o.customer_tenant_id = cu.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order) {
      return { status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
    }

    // 检查订单状态是否允许结算
    if (!['awarded', 'dispatched', 'in_transit', 'delivered'].includes(order.order_status)) {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'INVALID_ORDER_STATUS_FOR_SETTLEMENT',
          message: '订单状态不允许结算'
        } 
      };
    }

    // 2. 计算抽佣金额
    const commissionCalculation = await db.get(`
      SELECT final_commission_percent, calculated_amount as commission_amount
      FROM commission_history
      WHERE order_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [order_id]);

    if (!commissionCalculation) {
      return { status: 404, body: { success: false, error: 'COMMISSION_CALCULATION_NOT_FOUND' } };
    }

    // 3. 获取相关钱包
    // 确保钱包存在，如果不存在则创建
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('platform', 1, 0.0, 0.0, 'active')
    `);
    
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('carrier', ?, 0.0, 0.0, 'active')
    `, [order.carrier_id]);
    
    await db.run(`
      INSERT OR IGNORE INTO wallets (owner_type, owner_id, balance, frozen_amount, status)
      VALUES ('customer', ?, 0.0, 0.0, 'active')
    `, [order.customer_tenant_id]);

    const platformWallet = await db.get(
      `SELECT id, balance, (balance - frozen_amount) as available_balance FROM wallets WHERE owner_type = 'platform' AND owner_id = 1`
    );
    
    const carrierWallet = await db.get(
      `SELECT id, balance, (balance - frozen_amount) as available_balance FROM wallets WHERE owner_type = 'carrier' AND owner_id = ?`,
      [order.carrier_id]
    );
    
    const customerWallet = await db.get(
      `SELECT id, balance, (balance - frozen_amount) as available_balance FROM wallets WHERE owner_type = 'customer' AND owner_id = ?`,
      [order.customer_tenant_id]
    );

    if (!platformWallet || !carrierWallet || !customerWallet) {
      return { status: 404, body: { success: false, error: 'WALLETS_NOT_FOUND' } };
    }

    // 4. 开始事务处理
    await db.run('BEGIN TRANSACTION');

    // 5. 计算金额
    const grossAmount = order.total_price_with_addons || order.quote_price || 0;
    const commissionAmount = commissionCalculation.commission_amount;
    const netAmount = grossAmount - commissionAmount;

    // 检查客户钱包余额是否足够
    if (customerWallet.available_balance < grossAmount) {
      await db.run('ROLLBACK');
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'INSUFFICIENT_FUNDS',
          message: '客户钱包余额不足'
        } 
      };
    }

    // 6. 执行抽佣交易（客户 -> 平台）
    const commissionTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'expense', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      customerWallet.id, order_id, commissionAmount, -commissionAmount,
      `订单 ${order_id} 抽佣`, `COMMISSION-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
      [commissionAmount, customerWallet.id]
    );

    const platformTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'income', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      platformWallet.id, order_id, commissionAmount, commissionAmount,
      `订单 ${order_id} 抽佣收入`, `COMMISSION-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
      [commissionAmount, platformWallet.id]
    );

    // 7. 执行支付交易（客户 -> 承运商）
    const paymentTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'expense', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      customerWallet.id, order_id, netAmount, -netAmount,
      `订单 ${order_id} 支付给承运商`, `PAYMENT-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
      [netAmount, customerWallet.id]
    );

    const carrierTx = await db.run(`
      INSERT INTO wallet_transactions (
        wallet_id, order_id, transaction_type, amount, balance_change, 
        description, reference_id, created_at, processed_at
      ) VALUES (?, ?, 'income', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      carrierWallet.id, order_id, netAmount, netAmount,
      `订单 ${order_id} 收入`, `PAYMENT-${order_id}`
    ]);

    await db.run(
      `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
      [netAmount, carrierWallet.id]
    );

    // 8. 记录结算详情
    await db.run(`
      INSERT INTO settlements (
        order_id, carrier_wallet_id, platform_wallet_id, 
        gross_amount, commission_amount, net_amount, 
        settlement_status, commission_transaction_id, payment_transaction_id,
        created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))
    `, [
      order_id, carrierWallet.id, platformWallet.id,
      grossAmount, commissionAmount, netAmount,
      commissionTx.lastID, carrierTx.lastID
    ]);

    // 9. 更新订单状态为已完成
    await db.run(
      `UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?`,
      [order_id]
    );

    await db.run('COMMIT');

    return {
      status: 200,
      body: {
        success: true,
        message: 'Settlement completed successfully',
        data: {
          order_id,
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          order_status: 'completed',
          wallets: {
            customer: { id: customerWallet.id, balance: customerWallet.balance - grossAmount },
            carrier: { id: carrierWallet.id, balance: carrierWallet.balance + netAmount },
            platform: { id: platformWallet.id, balance: platformWallet.balance + commissionAmount }
          },
          transactions: {
            commission: { id: commissionTx.lastID, wallet_id: customerWallet.id, amount: -commissionAmount },
            platform_income: { id: platformTx.lastID, wallet_id: platformWallet.id, amount: commissionAmount },
            payment: { id: paymentTx.lastID, wallet_id: customerWallet.id, amount: -netAmount },
            carrier_income: { id: carrierTx.lastID, wallet_id: carrierWallet.id, amount: netAmount }
          }
        }
      }
    };

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Settlement error:', error);
    return { status: 500, body: { success: false, error: 'INTERNAL_SERVER_ERROR' } };
  }
};