// backend/api/handlers/admin/risk-control/createViolationRecord.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  console.log("--- 风控违规记录创建处理器启动 ---");
  
  // 验证管理员权限
  if (!c.context || !c.context.roles || !c.context.roles.includes('admin')) {
    console.warn("⚠️ Unauthorized: Admin role required");
    return { status: 403, body: { success: false, error: 'FORBIDDEN', message: '需要管理员权限' } };
  }

  const { order_id, violation_type, target_type, target_id, description, evidence } = c.request.body;

  if (!order_id || !violation_type || !target_type || !target_id || !description) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'MISSING_PARAMETERS',
        message: '缺少必要参数: order_id, violation_type, target_type, target_id, description'
      }
    };
  }

  // 验证违规类型
  const validViolationTypes = [
    'carrier_cancel_before_choice',    // 承运商在客户选择前取消
    'carrier_cancel_after_choice',     // 承运商在客户选择后取消
    'customer_cancel',                 // 客户取消
    'late_delivery',                   // 延迟配送
    'damaged_goods',                   // 货物损坏
    'service_complaint'                // 服务投诉
  ];

  if (!validViolationTypes.includes(violation_type)) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'INVALID_VIOLATION_TYPE',
        message: '无效的违规类型'
      }
    };
  }

  const db = getDb();
  
  try {
    // 检查订单是否存在
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!order) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: '订单不存在'
        }
      };
    }

    // 根据违规类型计算处罚积分
    const penaltyPointsMap = {
      'carrier_cancel_before_choice': 5,   // 客户选择前取消 - 轻微处罚
      'carrier_cancel_after_choice': 20,   // 客户选择后取消 - 严重处罚
      'customer_cancel': 0,                // 客户取消 - 通常不处罚
      'late_delivery': 10,                 // 延迟配送 - 中等处罚
      'damaged_goods': 15,                 // 货物损坏 - 中等处罚
      'service_complaint': 8               // 服务投诉 - 中等处罚
    };

    const penaltyPoints = penaltyPointsMap[violation_type];

    // 插入违规记录
    const result = await db.run(`
      INSERT INTO violation_records (
        order_id, violation_type, target_type, target_id, description, 
        penalty_points, evidence, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      order_id, violation_type, target_type, target_id, description,
      penaltyPoints, evidence || null, 'pending', c.context.id
    ]);

    // 获取插入的记录ID
    const newRecordId = result.lastID;

    // 获取订单和目标信息
    const recordWithDetails = await db.get(`
      SELECT 
        vr.id,
        vr.order_id,
        vr.violation_type,
        vr.target_type,
        vr.target_id,
        vr.description,
        vr.penalty_points,
        vr.status,
        vr.created_at,
        o.tracking_number,
        t.name as target_name
      FROM violation_records vr
      JOIN orders o ON vr.order_id = o.id
      JOIN tenants t ON vr.target_id = t.id
      WHERE vr.id = ?
    `, [newRecordId]);

    return {
      status: 201,
      body: {
        success: true,
        message: '违规记录创建成功',
        data: recordWithDetails
      }
    };

  } catch (error) {
    console.error('💥 [CREATE VIOLATION RECORD ERROR]:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : '发生内部服务器错误'
      }
    };
  }
};