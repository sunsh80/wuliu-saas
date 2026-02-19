/**
 * 更新申请（仅允许更新待审核的申请）
 * PUT /api/tenant-web/applications/:id
 * operationId: updateTenantApplication
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

  const db = await getDb();

  try {
    // 检查申请是否存在且属于当前租户
    const existingApplication = await db.get(
      'SELECT * FROM tenant_applications WHERE id = ? AND tenant_id = ?',
      [applicationId, tenantId]
    );

    if (!existingApplication) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: '申请不存在'
        }
      };
    }

    // 只允许更新待审核的申请
    if (existingApplication.status !== 'pending') {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: '只能修改待审核的申请'
        }
      };
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (company_name !== undefined) {
      updateFields.push('company_name = ?');
      updateValues.push(company_name);
    }
    if (contact_person !== undefined) {
      updateFields.push('contact_person = ?');
      updateValues.push(contact_person);
    }
    if (contact_phone !== undefined) {
      updateFields.push('contact_phone = ?');
      updateValues.push(contact_phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (business_license !== undefined) {
      updateFields.push('business_license = ?');
      updateValues.push(business_license);
    }
    if (service_area !== undefined) {
      updateFields.push('service_area = ?');
      updateValues.push(service_area);
    }
    if (service_radius_km !== undefined) {
      updateFields.push('service_radius_km = ?');
      updateValues.push(service_radius_km);
    }
    if (capacity_kg !== undefined) {
      updateFields.push('capacity_kg = ?');
      updateValues.push(capacity_kg);
    }
    if (capacity_m3 !== undefined) {
      updateFields.push('capacity_m3 = ?');
      updateValues.push(capacity_m3);
    }
    if (base_price_per_km !== undefined) {
      updateFields.push('base_price_per_km = ?');
      updateValues.push(base_price_per_km);
    }
    if (license_file !== undefined) {
      updateFields.push('license_file = ?');
      updateValues.push(license_file);
    }
    if (other_files !== undefined) {
      updateFields.push('other_files = ?');
      updateValues.push(other_files);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: '没有提供要更新的字段'
        }
      };
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(applicationId, tenantId);

    const updateQuery = `
      UPDATE tenant_applications
      SET ${updateFields.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `;

    await db.run(updateQuery, updateValues);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '申请更新成功',
        data: {
          id: applicationId
        }
      }
    };
  } catch (error) {
    console.error('更新申请失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: '更新申请失败',
        error: error.message
      }
    };
  }
};
