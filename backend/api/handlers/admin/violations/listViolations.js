// backend/api/handlers/admin/violations/listViolations.js
const { getDb } = require('../../../../db/index.js');
const ViolationModel = require('../../../../db/models/Violation');

module.exports = async (c) => {
  const db = getDb();
  const violationModel = new ViolationModel();
  
  try {
    const { status, severity, violation_type, tenant_id } = c.request.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (violation_type) filters.violation_type = violation_type;
    if (tenant_id) filters.tenant_id = tenant_id;
    
    const violations = await violationModel.listAll(filters);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          violations,
          total: violations.length
        }
      }
    };
  } catch (error) {
    console.error('获取违规记录列表失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '获取违规记录列表失败'
      }
    };
  }
};
