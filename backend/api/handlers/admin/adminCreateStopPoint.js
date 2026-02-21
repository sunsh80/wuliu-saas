// backend/api/handlers/admin/adminCreateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const body = c.request.body;
    const { name, address, lat, lng, type = 'other', region, capacity, description } = body || {};

    if (!name || !address || lat === undefined || lng === undefined) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '缺少必填字段' } };
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '坐标超出范围' } };
    }

    const db = getDb();
    const result = await db.run(
      `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [name, address, parseFloat(lat), parseFloat(lng), type || 'other', region || '', capacity || 1, description || '']
    );
    const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);

    return { status: 201, body: { success: true, message: '创建成功', data: newStopPoint } };
  } catch (error) {
    console.error('❌ [Admin] Create stop point error:', error);
    return { status: 500, body: { success: false, error: 'CREATE_FAILED', message: error.message } };
  }
};
