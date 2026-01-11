// utils.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 示例：添加一个通用错误类（可选）
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 示例：邮箱校验（可选）
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  bcrypt,
  jwt,
  AppError,
  validateEmail
};