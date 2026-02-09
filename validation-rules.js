/**
 * 共享验证规则库
 * 提供前后端一致的验证函数
 * 文件路径: validation-rules.js
 */

// 验证手机号码 (中国大陆)
function validatePhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^1[3-9][0-9]{9}$/;
  return phoneRegex.test(phone);
}

// 验证邮箱地址
function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证密码强度
function validatePassword(password) {
  if (!password) return false;
  
  // 密码至少6位
  if (password.length < 6) {
    return false;
  }
  
  // 密码不能过于简单 (例如全数字或全字母)
  const isAllDigits = /^\d+$/.test(password);
  const isAllLetters = /^[a-zA-Z]+$/.test(password);
  
  if (isAllDigits || isAllLetters) {
    return false;
  }
  
  return true;
}

// 验证用户名 (只能包含字母、数字、下划线，长度4-20)
function validateUsername(username) {
  if (!username) return false;
  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
  return usernameRegex.test(username);
}

// 验证公司名称 (2-50个字符)
function validateCompanyName(name) {
  if (!name) return false;
  return name.length >= 2 && name.length <= 50;
}

// 验证营业执照号 (统一社会信用代码，18位)
function validateBusinessLicense(license) {
  if (!license) return false;
  // 简化的统一社会信用代码验证 (18位，包含数字和大写字母)
  const licenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
  return licenseRegex.test(license);
}

// 验证身份证号码 (18位)
function validateIdCard(idCard) {
  if (!idCard) return false;
  const idCardRegex = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$)/;
  return idCardRegex.test(idCard);
}

// 验证金额 (最多两位小数)
function validateAmount(amount) {
  if (amount == null) return false;
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount.toString());
}

// 验证整数
function validateInteger(num) {
  if (num == null) return false;
  const intRegex = /^\d+$/;
  return intRegex.test(num.toString());
}

// 验证订单号 (字母数字组合，8-32位)
function validateOrderNumber(orderNum) {
  if (!orderNum) return false;
  const orderNumRegex = /^[A-Za-z0-9]{8,32}$/;
  return orderNumRegex.test(orderNum);
}

// 验证车辆牌照
function validateVehiclePlate(plate) {
  if (!plate) return false;
  // 简化的车牌号验证 (包括新能源车牌)
  const plateRegex = /^[\u4e00-\u9fa5]{1}[A-Z]{1}[A-Z0-9]{5,6}$/;
  return plateRegex.test(plate);
}

// 验证司机姓名 (2-10个汉字)
function validateDriverName(name) {
  if (!name) return false;
  const nameRegex = /^[\u4e00-\u9fa5]{2,10}$/;
  return nameRegex.test(name);
}

// 导出所有验证函数
module.exports = {
  validatePhone,
  validateEmail,
  validatePassword,
  validateUsername,
  validateCompanyName,
  validateBusinessLicense,
  validateIdCard,
  validateAmount,
  validateInteger,
  validateOrderNumber,
  validateVehiclePlate,
  validateDriverName,
  
  // 为了向后兼容，也导出一个包含所有规则的对象
  VALIDATION_RULES: {
    validatePhone,
    validateEmail,
    validatePassword,
    validateUsername,
    validateCompanyName,
    validateBusinessLicense,
    validateIdCard,
    validateAmount,
    validateInteger,
    validateOrderNumber,
    validateVehiclePlate,
    validateDriverName
  }
};