/**
 * AI友好的验证中间件
 * 基于validation-metadata.json中的规则进行自动验证
 */

const { VALIDATION_RULES } = require('../validation-rules.js');
const fs = require('fs');
const path = require('path');

// 加载验证元数据
const validationMetadata = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../validation-metadata.json'), 'utf8')
);

/**
 * 通用验证函数
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 * @param {string} tableName - 表名（可选，用于更精确的验证）
 * @returns {boolean} - 验证结果
 */
function validateField(field, value, tableName = null) {
  // 如果值为空，根据字段是否必需决定是否通过
  if (value == null || value === '') {
    // 对于大多数验证字段，空值可能不通过验证
    // 但这里我们只对非必需字段返回true
    // 实际业务中可能需要更复杂的必需性判断
    return true; // 简化处理，实际项目中需要更复杂的逻辑
  }

  // 查找匹配的验证规则
  for (const [ruleName, ruleConfig] of Object.entries(validationMetadata)) {
    // 检查该字段是否在规则的数据库字段列表中
    if (ruleConfig.database_field && ruleConfig.database_field.includes(field)) {
      if (ruleConfig.pattern) {
        // 使用正则表达式验证
        const regex = new RegExp(ruleConfig.pattern);
        return regex.test(value.toString());
      } else if (ruleConfig.min_length !== undefined) {
        // 验证最小长度
        return value.toString().length >= ruleConfig.min_length;
      }
    }
  }
  
  // 如果没有找到特定规则，则认为验证通过
  return true;
}

/**
 * 批量验证对象中的多个字段
 * @param {Object} obj - 要验证的对象
 * @param {string} tableName - 表名（可选）
 * @returns {Object} - 包含验证结果和错误信息的对象
 */
function validateObject(obj, tableName = null) {
  const result = {
    isValid: true,
    errors: []
  };

  for (const [field, value] of Object.entries(obj)) {
    if (!validateField(field, value, tableName)) {
      result.isValid = false;
      result.errors.push({
        field: field,
        value: value,
        message: `Field '${field}' does not match validation rules`
      });
    }
  }

  return result;
}

/**
 * 创建特定表的验证器
 * @param {string} tableName - 表名
 * @returns {Function} - 验证函数
 */
function createTableValidator(tableName) {
  return function(data) {
    return validateObject(data, tableName);
  };
}

module.exports = {
  validateField,
  validateObject,
  createTableValidator,
  validationMetadata
};