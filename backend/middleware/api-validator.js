/**
 * API端点验证器
 * 用于验证API请求体中的字段
 */

const { validateObject } = require('../middleware/validation.js');

/**
 * 创建API验证中间件
 * @param {Object} schema - 验证模式定义
 * @returns {Function} - Express中间件函数
 */
function createApiValidator(schema) {
  return (req, res, next) => {
    // 验证请求体
    if (req.body && typeof req.body === 'object') {
      const validation = validateObject(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }
    }
    
    // 验证查询参数
    if (req.query && typeof req.query === 'object') {
      const queryValidation = validateObject(req.query);
      
      if (!queryValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter validation failed',
          errors: queryValidation.errors
        });
      }
    }
    
    // 验证URL参数
    if (req.params && typeof req.params === 'object') {
      const paramsValidation = validateObject(req.params);
      
      if (!paramsValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'URL parameter validation failed',
          errors: paramsValidation.errors
        });
      }
    }
    
    next();
  };
}

/**
 * 验证特定字段的中间件
 * @param {string[]} fields - 要验证的字段列表
 * @returns {Function} - Express中间件函数
 */
function createFieldValidator(fields) {
  return (req, res, next) => {
    const errors = [];
    
    for (const field of fields) {
      // 检查请求体
      if (req.body && req.body.hasOwnProperty(field)) {
        if (!validateObject({ [field]: req.body[field] }).isValid) {
          errors.push({
            field: field,
            value: req.body[field],
            message: `Field '${field}' does not match validation rules`
          });
        }
      }
      
      // 检查查询参数
      if (req.query && req.query.hasOwnProperty(field)) {
        if (!validateObject({ [field]: req.query[field] }).isValid) {
          errors.push({
            field: field,
            value: req.query[field],
            message: `Query parameter '${field}' does not match validation rules`
          });
        }
      }
      
      // 检查URL参数
      if (req.params && req.params.hasOwnProperty(field)) {
        if (!validateObject({ [field]: req.params[field] }).isValid) {
          errors.push({
            field: field,
            value: req.params[field],
            message: `URL parameter '${field}' does not match validation rules`
          });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Field validation failed',
        errors: errors
      });
    }
    
    next();
  };
}

module.exports = {
  createApiValidator,
  createFieldValidator
};