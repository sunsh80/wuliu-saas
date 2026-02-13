/**
 * 车型库API路由配置
 */

const express = require('express');
const router = express.Router();

// 导入分散的车型库处理器
const listVehicleModels = require('../../handlers/vehicle-models/index');
const getVehicleModel = require('../../handlers/vehicle-models/get');
const createVehicleModel = require('../../handlers/vehicle-models/post');
const updateVehicleModel = require('../../handlers/vehicle-models/put');
const deleteVehicleModel = require('../../handlers/vehicle-models/delete');
const getVehicleTypes = require('../../handlers/vehicle-models/getVehicleTypes');
const getAutonomousLevels = require('../../handlers/vehicle-models/getAutonomousLevels');

// 获取车型库列表
router.get('/', listVehicleModels);

// 获取车型详情
router.get('/:id', getVehicleModel);

// 创建车型
router.post('/', createVehicleModel);

// 更新车型
router.put('/:id', updateVehicleModel);

// 删除车型
router.delete('/:id', deleteVehicleModel);

// 获取车型类型列表
router.get('/types', getVehicleTypes);

// 获取自动驾驶级别列表
router.get('/autonomous-levels', getAutonomousLevels);

module.exports = router;