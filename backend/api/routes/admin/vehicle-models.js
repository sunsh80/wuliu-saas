/**
 * 车型库API路由
 */

const express = require('express');
const router = express.Router();

// 导入分散的处理器
const listVehicleModels = require('../../handlers/admin/vehicle-models/listVehicleModels');
const createVehicleModel = require('../../handlers/admin/vehicle-models/createVehicleModel');
const getVehicleModel = require('../../handlers/admin/vehicle-models/getVehicleModel');
const updateVehicleModel = require('../../handlers/admin/vehicle-models/updateVehicleModel');
const deleteVehicleModel = require('../../handlers/admin/vehicle-models/deleteVehicleModel');

// 获取车型库列表
router.get('/', listVehicleModels);

// 创建车型
router.post('/', createVehicleModel);

// 获取车型详情
router.get('/:id', getVehicleModel);

// 更新车型
router.put('/:id', updateVehicleModel);

// 删除车型
router.delete('/:id', deleteVehicleModel);

module.exports = router;