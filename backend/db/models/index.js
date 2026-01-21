// backend/db/models/index.js

// 只导出类，不创建实例！
const UserModel = require('./User');
const TenantModel = require('./Tenant');
const OrganizationModel = require('./Organization');
const OrderModel = require('./Order');
const CustomerModel = require('./Customer');

module.exports = {
  User: UserModel,
  Tenant: TenantModel,
  Organization: OrganizationModel,
  Order: OrderModel,
  Customer: CustomerModel
};