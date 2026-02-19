/**
 * 获取单个申请详情
 * GET /api/tenant-web/applications/:id
 * operationId: getTenantApplicationById
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

  const applicationId = c.request.params.id;
  if (!applicationId) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '申请 ID 为必填项'
      }
    };
  }

  const db = await getDb();

  try {
    const application = await db.get(
      `SELECT
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
      WHERE id = ? AND tenant_id = ?`,
      [applicationId, tenantId]
    );

    if (!application) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: '申请不存在'
        }
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          application: application
        }
      }
    };
  } catch (error) {
    console.error('获取申请详情失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '获取申请详情失败',
        error: error.message
      }
    };
  }
};
