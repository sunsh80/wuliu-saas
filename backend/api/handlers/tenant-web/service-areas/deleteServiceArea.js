/**
 * 服务区域 API 处理程序 - 删除服务区域
 */

const { getDb } = require('../../../../db');

module.exports = async (c) => {
  const tenantId = c.session?.tenantId || c.context?.tenantId;
  if (!tenantId) {
    return {
      statusCode: 401,
      body: {
        success: false,
        message: '未授权访问'
      }
    };
  }

  const { id } = c.request.params;
  if (!id) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '服务区域 ID 不能为空'
      }
    };
  }

  const db = await getDb();

  try {
    // 先检查该服务区域是否属于当前租户
    const area = await db.get(
      'SELECT id, tenant_id FROM service_areas WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!area) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: '服务区域不存在或无权操作'
        }
      };
    }

    // 删除服务区域
    await db.run('DELETE FROM service_areas WHERE id = ?', [id]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '服务区域删除成功'
      }
    };
  } catch (error) {
    console.error('删除服务区域失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '删除服务区域失败',
        error: error.message
      }
    };
  }
};
