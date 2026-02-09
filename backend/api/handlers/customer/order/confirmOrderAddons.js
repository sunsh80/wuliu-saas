// backend/api/handlers/customer/order/confirmOrderAddons.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log('[confirmOrderAddons] 开始处理确认订单附加费请求');

  try {
    // 1. 认证与授权检查
    const userId = c.context?.id || c.request.session?.userId;
    const tenantId = c.request.session?.tenantId || c.context?.tenantId;
    
    if (!userId || !tenantId) {
      console.warn('❌ 未授权: 找不到用户ID或租户ID');
      return {
        status: 401,
        body: {
          success: false,
          error: 'UNAUTHORIZED',
          message: '需要身份验证'
        }
      };
    }

    // 2. 提取路径参数和请求体
    const orderId = c.request.params.id;
    const { confirm } = c.request.body; // true表示确认，false表示拒绝

    if (!orderId) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_ORDER_ID',
          message: '订单ID是必需的'
        }
      };
    }

    if (confirm === undefined) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_CONFIRM_PARAM',
          message: '必须提供确认参数 (true/false)'
        }
      };
    }

    const db = getDb();

    // 3. 验证订单是否存在且由当前客户创建
    const order = await db.get(`
      SELECT 
        o.id, 
        o.customer_tenant_id, 
        o.status, 
        o.addons_total,
        o.addons_status,
        t.id as tenant_id
      FROM orders o
      JOIN tenants t ON o.customer_tenant_id = t.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: '订单未找到'
        }
      };
    }

    // 验证当前用户是否为订单的客户
    if (order.customer_tenant_id != tenantId) {
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: '您无权确认此订单的附加费'
        }
      };
    }

    // 4. 检查订单当前是否处于待确认附加费状态
    if (!order.addons_total || order.addons_status !== 'pending') {
      return {
        status: 400,
        body: {
          success: false,
          error: 'INVALID_ORDER_STATUS',
          message: '订单当前没有待确认的附加费'
        }
      };
    }

    // 5. 更新订单的附加费状态
    const newStatus = confirm ? 'confirmed' : 'rejected';
    const confirmationTime = newStatus === 'confirmed' ? new Date().toISOString() : null;

    const result = await db.run(`
      UPDATE orders 
      SET 
        addons_status = ?,
        addons_confirmation_time = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      newStatus,
      confirmationTime,
      orderId
    ]);

    if (result.changes === 0) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'UPDATE_FAILED',
          message: '更新订单附加费状态失败'
        }
      };
    }

    // 6. 如果确认了附加费，可能需要更新订单总价
    if (confirm && order.addons_total > 0) {
      // 更新订单总价（原价+附加费）
      await db.run(`
        UPDATE orders 
        SET 
          quote_price = quote_price + ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [order.addons_total, orderId]);
    }

    // 7. 获取更新后的订单信息
    const updatedOrder = await db.get(`
      SELECT 
        id, 
        tracking_number, 
        status, 
        quote_price,
        addons_total, 
        addons_status,
        addons_confirmation_time,
        created_at,
        updated_at
      FROM orders 
      WHERE id = ?
    `, [orderId]);

    // 8. 返回成功响应
    const actionMessage = confirm ? '确认' : '拒绝';
    return {
      status: 200,
      body: {
        success: true,
        message: `订单附加费已${actionMessage}`,
        data: {
          order_id: updatedOrder.id,
          tracking_number: updatedOrder.tracking_number,
          addons_total: updatedOrder.addons_total,
          addons_status: updatedOrder.addons_status,
          addons_confirmation_time: updatedOrder.addons_confirmation_time,
          total_price_with_addons: updatedOrder.quote_price,
          updated_at: updatedOrder.updated_at
        }
      }
    };

  } catch (error) {
    console.error('💥 [确认订单附加费处理器错误]:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '确认订单附加费失败'
      }
    };
  }
};