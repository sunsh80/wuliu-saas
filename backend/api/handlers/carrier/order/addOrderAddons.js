// backend/api/handlers/carrier/order/addOrderAddons.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log('[addOrderAddons] 开始处理添加订单附加费请求');

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
    const { addons_config, addons_total, description } = c.request.body;

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

    if (!addons_config || addons_total === undefined) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_ADDONS_DATA',
          message: '附加费配置和总额是必需的'
        }
      };
    }

    const db = getDb();

    // 3. 验证订单是否存在且由当前承运商负责
    const order = await db.get(`
      SELECT id, carrier_id, status, tenant_id 
      FROM orders 
      WHERE id = ?
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

    // 验证当前用户是否为此订单的承运商
    if (order.carrier_id != userId) {
      return {
        status: 403,
        body: {
          success: false,
          error: 'FORBIDDEN',
          message: '您无权为此订单添加附加费'
        }
      };
    }

    // 4. 更新订单的附加费信息
    const result = await db.run(`
      UPDATE orders 
      SET 
        addons_config = ?,
        addons_total = ?,
        addons_status = 'pending',
        description = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      JSON.stringify(addons_config),
      parseFloat(addons_total),
      description || order.description,
      orderId
    ]);

    if (result.changes === 0) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'UPDATE_FAILED',
          message: '更新订单附加费信息失败'
        }
      };
    }

    // 5. 获取更新后的订单信息
    const updatedOrder = await db.get(`
      SELECT 
        id, 
        tracking_number, 
        status, 
        addons_config, 
        addons_total, 
        addons_status,
        created_at,
        updated_at
      FROM orders 
      WHERE id = ?
    `, [orderId]);

    // 6. 返回成功响应
    return {
      status: 200,
      body: {
        success: true,
        message: '订单附加费添加成功',
        data: {
          order_id: updatedOrder.id,
          tracking_number: updatedOrder.tracking_number,
          addons_config: JSON.parse(updatedOrder.addons_config || '{}'),
          addons_total: updatedOrder.addons_total,
          addons_status: updatedOrder.addons_status,
          updated_at: updatedOrder.updated_at
        }
      }
    };

  } catch (error) {
    console.error('💥 [添加订单附加费处理器错误]:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '添加订单附加费失败'
      }
    };
  }
};