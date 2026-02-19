/**
 * 获取承运商（租户）的申请历史列表
 * GET /api/tenant-web/applications
 * operationId: listTenantApplications
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

  const page = parseInt(c.request.query.page) || 1;
  const limit = parseInt(c.request.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = await getDb();

  try {
    // 从 tenant_applications 表查询申请历史
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tenant_applications
      WHERE tenant_id = ?
    `;

    const countResult = await db.get(countQuery, [tenantId]);
    const total = countResult?.total || 0;

    const query = `
      SELECT
        id,
        tenant_id,
        company_name,
        contact_person,
        contact_phone,
        email,
        business_license,
        service_area,
        service_radius_km,
        capacity_kg,
        capacity_m3,
        base_price_per_km,
        license_file,
        other_files,
        notes,
        status,
        created_at,
        updated_at
      FROM tenant_applications
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const applications = await db.all(query, [tenantId, limit, offset]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '获取申请历史成功',
        data: {
          applications: applications,
          pagination: {
            current_page: page,
            per_page: limit,
            total: total,
            total_pages: Math.ceil(total / limit),
            has_next: page < Math.ceil(total / limit),
            has_prev: page > 1
          }
        }
      }
    };
  } catch (error) {
    console.error('获取申请历史失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '获取申请历史失败',
        error: error.message
      }
    };
  }
};
