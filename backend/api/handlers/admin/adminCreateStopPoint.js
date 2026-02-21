// backend/api/handlers/admin/adminCreateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('[Admin] Create StopPoint handler called');
  
  try {
    const body = c.request.body;
    const { name, address, lat, lng, type = 'other', region, capacity, description, submitForApproval = true } = body || {};

    if (!name || !address || lat === undefined || lng === undefined) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '缺少必填字段' } };
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '坐标超出范围' } };
    }

    const db = getDb();
    // 根据 submitForApproval 决定状态：true=approved (直接生效), false=draft (草稿)
    const approvalStatus = submitForApproval ? 'approved' : 'draft';
    const status = submitForApproval ? 'active' : 'inactive';
    const message = submitForApproval ? '创建成功' : '已保存为草稿';
    
    console.log('[Admin] 创建停靠点:', { name, approvalStatus, status });

    const result = await db.run(
      `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status, approval_status, upload_source) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`,
      [name, address, parseFloat(lat), parseFloat(lng), type || 'other', region || '', capacity || 1, description || '', status, approvalStatus]
    );
    const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);

    return { status: 201, body: { success: true, message: message, data: newStopPoint } };
  } catch (error) {
    console.error('❌ [Admin] Create stop point error:', error);
    return { status: 500, body: { success: false, error: 'CREATE_FAILED', message: error.message } };
  }
};
