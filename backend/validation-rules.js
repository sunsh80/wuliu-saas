/**
 * 后端验证规则库
 * 与前端小程序共享的统一验证规则
 * 确保前后端验证逻辑一致性
 */

// 验证规则常量
const VALIDATION_RULES = {
  // 手机号验证规则 - 中国手机号格式
  PHONE_PATTERN: /^1[3-9][0-9]{9}$/,

  // 邮箱验证规则
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // 密码强度验证规则
  PASSWORD_MIN_LENGTH: 6,

  // 用户名验证规则
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]{3,20}$/,

  // 名称验证规则
  NAME_PATTERN: /^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,50}$/,

  // 地址验证规则
  ADDRESS_PATTERN: /^[\u4e00-\u9fa5a-zA-Z0-9\s\S]{1,200}$/
};

/**
 * 验证手机号格式
 * @param {string} phone - 待验证的手机号
 * @returns {boolean} - 是否符合格式
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return VALIDATION_RULES.PHONE_PATTERN.test(phone.trim());
}

/**
 * 验证邮箱格式
 * @param {string} email - 待验证的邮箱
 * @returns {boolean} - 是否符合格式
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return VALIDATION_RULES.EMAIL_PATTERN.test(email.trim());
}

/**
 * 验证密码强度
 * @param {string} password - 待验证的密码
 * @returns {boolean} - 是否符合强度要求
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
}

/**
 * 验证用户名格式
 * @param {string} username - 待验证的用户名
 * @returns {boolean} - 是否符合格式
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  return VALIDATION_RULES.USERNAME_PATTERN.test(username.trim());
}

/**
 * 验证姓名格式
 * @param {string} name - 待验证的姓名
 * @returns {boolean} - 是否符合格式
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return VALIDATION_RULES.NAME_PATTERN.test(name.trim());
}

/**
 * 验证地址格式
 * @param {string} address - 待验证的地址
 * @returns {boolean} - 是否符合格式
 */
function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return VALIDATION_RULES.ADDRESS_PATTERN.test(address.trim());
}

// 导出验证规则和函数
module.exports = {
  VALIDATION_RULES,
  validatePhone,
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
  validateAddress
};
