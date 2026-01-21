# 📜 Handler 文件命名与路径映射表

> 自动生成于 2026-01-11  
> 源文件: `openapi.yaml`  
> **此表为命名唯一权威依据，请严格遵守！**

| API 路径 | 方法 | operationId | 推荐 Handler 路径 |
|---------|------|-------------|------------------|
| `/api/setup/status` | `GET` | `getSetupStatus` | `api/handlers/misc/getSetupStatus.js` |
| `/api/setup/admin` | `POST` | `createFirstAdmin` | `api/handlers/misc/createFirstAdmin.js` |
| `/api/admin/login` | `POST` | `adminLogin` | `api/handlers/admin/adminLogin.js` |
| `/api/admin/logout` | `POST` | `adminLogout` | `api/handlers/admin/adminLogout.js` |
| `/api/admin/profile` | `GET` | `getAdminProfile` | `api/handlers/misc/getAdminProfile.js` |
| `/api/admin/users` | `POST` | `createAdminUser` | `api/handlers/misc/createAdminUser.js` |
| `/api/admin/tenants/pending` | `GET` | `listPendingTenants` | `api/handlers/misc/listPendingTenants.js` |
| `/api/admin/tenants/{id}/approve` | `PUT` | `approveTenant` | `api/handlers/misc/approveTenant.js` |
| `/api/admin/tenants/{id}/reject` | `PUT` | `rejectTenant` | `api/handlers/misc/rejectTenant.js` |
| `/api/admin/orders` | `GET` | `listAdminOrders` | `api/handlers/misc/listAdminOrders.js` |
| `/api/admin/orders/{order_id}/status` | `PUT` | `updateOrderStatus` | `api/handlers/misc/updateOrderStatus.js` |
| `/api/public/orders` | `POST` | `createPublicOrder` | `api/handlers/public/createPublicOrder.js` |
| `/api/customer/orders` | `POST` | `createCustomerOrder` | `api/handlers/misc/createCustomerOrder.js` |
| `/api/customer/orders` | `GET` | `listCustomerOrders` | `api/handlers/misc/listCustomerOrders.js` |
| `/api/carrier/orders` | `GET` | `listCarrierOrders` | `api/handlers/misc/listCarrierOrders.js` |
| `/api/carrier/orders/{order_id}/claim` | `PUT` | `claimCarrierOrder` | `api/handlers/misc/claimCarrierOrder.js` |
| `/api/carrier/orders/{order_id}/complete` | `PUT` | `completeCarrierOrder` | `api/handlers/misc/completeCarrierOrder.js` |
| `/api/tenant-web/login` | `POST` | `loginTenantWeb` | `api/handlers/misc/loginTenantWeb.js` |
| `/api/tenant-web/profile` | `GET` | `getTenantProfile` | `api/handlers/misc/getTenantProfile.js` |
| `/api/tenant-web/profile/roles` | `GET` | `getTenantRoles` | `api/handlers/misc/getTenantRoles.js` |
| `/api/pc-tenant/apply` | `POST` | `applyPcTenant` | `api/handlers/misc/applyPcTenant.js` |
