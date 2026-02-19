/**
 * 创建承运商（租户）申请
 * POST /api/tenant-web/applications
 * operationId: createTenantApplication
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

  const {
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
    notes
  } = c.request.body;

  // 验证必要字段
  if (!company_name) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: '公司名称为必填项'
      }
    };
  }

  const db = await getDb();

  try {
    // 检查是否已有待审核的申请
    const existingApplication = await db.get(
      'SELECT id FROM tenant_applications WHERE tenant_id = ? AND status = ?',
      [tenantId, 'pending']
    );

    if (existingApplication) {
      return {
        statusCode: 409,
        body: {
          success: false,
          message: '您已有待审核的申请，无法重复提交'
        }
      };
    }

    // 插入新申请
    const insertQuery = `
      INSERT INTO tenant_applications (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `;

    await db.run(insertQuery, [
      tenantId,
      company_name,
      contact_person || null,
      contact_phone || null,
      email || null,
      business_license || null,
      service_area || null,
      service_radius_km || null,
      capacity_kg || null,
      capacity_m3 || null,
      base_price_per_km || null,
      license_file || null,
      other_files || null,
      notes || null
    ]);

    return {
      statusCode: 201,
      body: {
        success: true,
        message: '申请提交成功，请等待审核',
        data: {
          message: '申请已提交'
        }
      }
    };
  } catch (error) {
    console.error('创建申请失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '创建申请失败',
        error: error.message
      }
    };
  }
};
