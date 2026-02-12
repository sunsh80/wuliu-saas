/**
 * 车型库API路由配置
 */

const express = require('express');
const router = express.Router();
const { 
  listVehicleModels, 
  getVehicleModel, 
  createVehicleModel, 
  updateVehicleModel, 
  deleteVehicleModel,
  getVehicleTypes,
  getAutonomousLevels
} = require('../../handlers/vehicle-models');

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