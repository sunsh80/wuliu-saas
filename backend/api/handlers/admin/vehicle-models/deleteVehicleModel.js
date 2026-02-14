/**
 * 删除车型API处理程序（软删除）
 * operationId: deleteVehicleModel
 */

const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  try {
    const db = getDb();
    const id = parseInt(c.request.params.id);

    // 检查车型是否存在
    const existingModel = await db.get('SELECT * FROM vehicle_models WHERE id = ?', [id]);
    if (!existingModel) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: '车型不存在'
        }
      };
    }

    // 检查该车型是否正在被使用（例如在tenant_vehicles表中）
    const usedInVehicles = await db.get('SELECT 1 FROM tenant_vehicles WHERE vehicle_model_id = ? LIMIT 1', [id]);
    if (usedInVehicles) {
      return {
        statusCode: 409,
        body: {
          success: false,
          message: '车型正在被使用，无法删除',
          error: 'MODEL_IN_USE'
        }
      };
    }

    // 执行软删除操作 - 更新状态为'deleted'并记录删除时间
    const updateQuery = 'UPDATE vehicle_models SET status = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.run(updateQuery, ['deleted', id]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '车型删除成功'
      }
    };
  } catch (error) {
    console.error('删除车型失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '删除车型失败',
        error: 'INTERNAL_ERROR'
      }
    };
  }
};