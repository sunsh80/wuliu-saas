// backend/db/models/index.js
const User = require('./User'); // 导入原始 User.js
const Tenant = require('./Tenant');
const Organization = require('./Organization');
const Order = require('./Order');
const Customer = require('./Customer'); // 导入原始 Customer.js
// 导入新创建的模型
const CustomerApplication = require('./CustomerApplication'); // 导入新文件
const UserSession = require('./UserSession');               // 导入新文件

module.exports = {
  User,
  Tenant,
  Organization,
  Order,
  Customer,
  // 导出新模型
  CustomerApplication, // 直接导出
  UserSession,        // 直接导出
};