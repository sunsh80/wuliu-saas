/**
 * 承运商车辆API路由
 */

const express = require('express');
const router = express.Router();

// 导入分散的车辆处理器
const listTenantVehicles = require('../../handlers/tenant-web/vehicles/listTenantVehicles');
const createTenantVehicle = require('../../handlers/tenant-web/vehicles/addTenantVehicleWithModel');
const getTenantVehicle = require('../../handlers/tenant-web/vehicles/getTenantVehicleById');
const updateTenantVehicle = require('../../handlers/tenant-web/vehicles/updateTenantVehicle');
const deleteTenantVehicle = require('../../handlers/tenant-web/vehicles/deleteTenantVehicle');

// 导入可用车型库处理器
const listAvailableVehicleModelsForTenant = require('../../handlers/tenant-web/vehicle-models/listAvailableVehicleModels');

// 获取承运商车辆列表
router.get('/', listTenantVehicles);

// 创建承运商车辆
router.post('/', createTenantVehicle);

// 获取车辆详情
router.get('/:id', getTenantVehicle);

// 更新车辆信息
router.put('/:id', updateTenantVehicle);

// 删除车辆
router.delete('/:id', deleteTenantVehicle);

// 获取可用车型库列表（供承运商选择）
router.get('/available-models', listAvailableVehicleModelsForTenant);

module.exports = router;