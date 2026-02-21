// backend/db/models/index.js
const User = require('./User'); // 导入原始 User.js
const Tenant = require('./Tenant');
const Organization = require('./Organization');
const Order = require('./Order');
const Customer = require('./Customer'); // 导入原始 Customer.js
// 导入新创建的模型
const CustomerApplication = require('./CustomerApplication'); // 导入新文件
const UserSession = require('./UserSession');               // 导入新文件
const SystemSetting = require('./SystemSetting');           // 系统配置模型
const ServiceProvider = require('./ServiceProvider');       // 服务提供商模型
const VehicleTracking = require('./VehicleTracking');       // 车辆追踪模型
const Violation = require('./Violation');                   // 违规记录模型
const PricingRule = require('./PricingRule');               // 定价规则模型
const OrderModel = require('./OrderModel');                 // 订单模型

module.exports = {
  User,
  Tenant,
  Organization,
  Order,
  Customer,
  // 导出新模型
  CustomerApplication, // 直接导出
  UserSession,        // 直接导出
  SystemSetting,      // 系统配置
  ServiceProvider,    // 服务提供商
  VehicleTracking,    // 车辆追踪
  Violation,          // 违规记录
  PricingRule,        // 定价规则
  OrderModel          // 订单模型
};