// backend/api/handlers/admin/violations/createViolation.js
const ViolationModel = require('../../../../db/models/Violation');

module.exports = async (c) => {
  const violationModel = new ViolationModel();
  
  try {
    const violationData = c.request.body;
    
    // 必填字段验证
    const requiredFields = ['tenant_id', 'tenant_name', 'violation_type', 'description', 'violation_date', 'severity'];
    for (const field of requiredFields) {
      if (!violationData[field]) {
        return {
          statusCode: 400,
          body: {
            success: false,
            error: 'MISSING_REQUIRED_FIELD',
            message: `缺少必填字段：${field}`
          }
        };
      }
    }
    
    const violation = await violationModel.create(violationData);
    
    return {
      statusCode: 201,
      body: {
        success: true,
        data: violation
      }
    };
  } catch (error) {
    console.error('创建违规记录失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '创建违规记录失败'
      }
    };
  }
};
